import { createHash } from "node:crypto";
import { jwtVerify } from "jose";
import type { Grant, OidcClient } from "@/generated/prisma/client";
import { isScope, parseScopes, SCOPES, type Scope } from "@/lib/scopes";
import { auditIn } from "../audit";
import { randomToken, safeEqual, sha256 } from "../crypto/tokens";
import { db } from "../db";
import { env } from "../env";
import { AppError } from "../errors";
import { refreshStatus } from "../identity";
import type { Authenticated } from "../session";
import { claimsFor, pairwiseSubject } from "./claims";
import { publicKeyFor, signJwt } from "./keys";

/**
 * OpenID Connect provider — authorization code flow with PKCE.
 *
 * Deliberately small: one flow, done strictly.
 *  - PKCE (S256) is mandatory for every client, public or confidential.
 *  - Redirect URIs are matched exactly against the registered list.
 *  - Authorization codes are single use, live 60 seconds and are stored hashed.
 *  - Subjects are pairwise; claims are released per approved scope only.
 *  - Access tokens are short-lived and checked against the grant on every use,
 *    so revoking consent takes effect immediately.
 */

const REQUEST_TTL_MS = 10 * 60_000;
const CODE_TTL_MS = 60_000;
const TOKEN_TTL_SECONDS = 600;

export function discoveryDocument() {
  const issuer = env().appUrl;
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    userinfo_endpoint: `${issuer}/oauth/userinfo`,
    jwks_uri: `${issuer}/oauth/jwks`,
    scopes_supported: SCOPES,
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code"],
    subject_types_supported: ["pairwise"],
    id_token_signing_alg_values_supported: ["ES256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post", "none"],
    code_challenge_methods_supported: ["S256"],
    claims_supported: ["sub", "iss", "aud", "exp", "iat", "auth_time", "nonce", "acr", "amr", "amarid_unique", "amarid_liveness_date", "age_over_18", "nationalities", "name", "birthdate", "phone_number", "phone_number_verified", "verified_claims"],
    acr_values_supported: ["urn:amarid:loa:high"],
    prompt_values_supported: ["login", "consent"],
  };
}

// --------------------------------------------------------------------------
// Authorization request
// --------------------------------------------------------------------------

export type AuthorizationRequest = {
  clientId: string;
  redirectUri: string;
  scopes: Scope[];
  state: string | null;
  nonce: string | null;
  codeChallenge: string;
  prompt: "login" | "consent" | null;
  maxAge: number | null;
};

/** An error that must be shown to the person, because the redirect target cannot be trusted. */
export class AuthorizationDisplayError extends Error {}

/** An error that is reported back to the (validated) partner redirect URI. */
export class AuthorizationRedirectError extends Error {
  constructor(public readonly redirectUri: string, public readonly error: string, public readonly description: string, public readonly state: string | null) {
    super(error);
  }
  toUrl(): string {
    return redirectWith(this.redirectUri, { error: this.error, error_description: this.description, state: this.state });
  }
}

export function redirectWith(redirectUri: string, params: Record<string, string | null>): string {
  const url = new URL(redirectUri);
  for (const [k, v] of Object.entries(params)) if (v !== null) url.searchParams.set(k, v);
  url.searchParams.set("iss", env().appUrl); // RFC 9207: lets the client detect mix-up attacks
  return url.toString();
}

/** Validates an incoming /oauth/authorize call and stores it for the sign-in / consent screens. */
export async function beginAuthorization(params: URLSearchParams): Promise<{ requestId: string; request: AuthorizationRequest; client: OidcClient }> {
  const clientId = params.get("client_id") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const client = clientId ? await db.oidcClient.findUnique({ where: { clientId } }) : null;
  if (!client) throw new AuthorizationDisplayError("This sign-in link is for an application that is not registered with AmarID.");
  if (!client.redirectUris.includes(redirectUri)) {
    throw new AuthorizationDisplayError("This sign-in link would return you to an address the application has not registered.");
  }

  const state = params.get("state");
  const fail = (error: string, description: string) => new AuthorizationRedirectError(redirectUri, error, description, state);

  if (params.get("response_type") !== "code") throw fail("unsupported_response_type", "Only response_type=code is supported.");
  if (params.get("request") || params.get("request_uri")) throw fail("request_not_supported", "Request objects are not supported.");

  const requested = (params.get("scope") ?? "").split(/\s+/).filter(Boolean);
  if (!requested.includes("openid")) throw fail("invalid_scope", "The openid scope is required.");
  const notAllowed = requested.filter((s) => isScope(s) && !client.allowedScopes.includes(s));
  if (notAllowed.length > 0) throw fail("invalid_scope", `This client may not request: ${notAllowed.join(" ")}.`);

  const codeChallenge = params.get("code_challenge") ?? "";
  if (params.get("code_challenge_method") !== "S256" || !/^[A-Za-z0-9_-]{43}$/.test(codeChallenge)) {
    throw fail("invalid_request", "PKCE with code_challenge_method=S256 is required.");
  }

  const promptValues = (params.get("prompt") ?? "").split(/\s+/).filter(Boolean);
  if (promptValues.includes("none")) throw fail("interaction_required", "prompt=none is not supported.");
  const prompt = promptValues.includes("login") ? "login" : promptValues.includes("consent") ? "consent" : null;

  const maxAgeRaw = params.get("max_age");
  const maxAge = maxAgeRaw !== null && /^\d+$/.test(maxAgeRaw) ? Number(maxAgeRaw) : null;

  const request: AuthorizationRequest = {
    clientId: client.clientId,
    redirectUri,
    scopes: parseScopes(requested.join(" ")),
    state,
    nonce: params.get("nonce"),
    codeChallenge,
    prompt,
    maxAge,
  };
  const row = await db.challenge.create({
    data: { kind: "AUTHORIZATION_REQUEST", subject: client.clientId, data: request, expiresAt: new Date(Date.now() + REQUEST_TTL_MS) },
  });
  return { requestId: row.id, request, client };
}

export type PendingAuthorization = { requestId: string; createdAt: Date; request: AuthorizationRequest; client: OidcClient };

export async function loadAuthorization(requestId: string): Promise<PendingAuthorization | null> {
  if (!/^[0-9a-f-]{36}$/.test(requestId)) return null;
  const row = await db.challenge.findFirst({
    where: { id: requestId, kind: "AUTHORIZATION_REQUEST", consumedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!row) return null;
  const request = row.data as unknown as AuthorizationRequest;
  const client = await db.oidcClient.findUnique({ where: { clientId: request.clientId } });
  return client ? { requestId: row.id, createdAt: row.createdAt, request, client } : null;
}

/** Does the current session satisfy prompt=login / max_age for this request? */
export function sessionIsFreshEnough(pending: PendingAuthorization, auth: Authenticated): boolean {
  const authAt = auth.session.authAt.getTime();
  if (pending.request.prompt === "login" && authAt < pending.createdAt.getTime()) return false;
  if (pending.request.maxAge !== null && Date.now() - authAt > pending.request.maxAge * 1000) return false;
  return true;
}

export async function activeGrant(identityId: string, client: OidcClient): Promise<Grant | null> {
  return db.grant.findFirst({ where: { identityId, clientId: client.id, revokedAt: null } });
}

/** True when the person has already approved everything this request asks for. */
export function grantCovers(grant: Grant | null, scopes: Scope[]): boolean {
  return !!grant && scopes.every((s) => grant.scopes.includes(s));
}

/**
 * The citizen's decision. On approval the grant is recorded and a one-time code
 * is issued; either way the pending request is consumed.
 * Returns the URL to send the browser to.
 */
export async function decideAuthorization(pending: PendingAuthorization, auth: Authenticated, decision: { approve: boolean; scopes: Scope[] }): Promise<string> {
  const { request, client } = pending;
  const claimed = await db.challenge.updateMany({ where: { id: pending.requestId, consumedAt: null }, data: { consumedAt: new Date() } });
  if (claimed.count !== 1) throw new AppError("AUTHORIZATION_EXPIRED", 410);

  if (!decision.approve) {
    return redirectWith(request.redirectUri, { error: "access_denied", error_description: "The person declined.", state: request.state });
  }
  if (auth.identity.status !== "ACTIVE") throw new AppError("IDENTITY_NOT_ACTIVE", 403);
  if (!sessionIsFreshEnough(pending, auth)) throw new AppError("REAUTHENTICATION_REQUIRED", 401);

  // The person may approve fewer scopes than requested, never more.
  const approved = request.scopes.filter((s) => s === "openid" || decision.scopes.includes(s));
  const code = randomToken();

  await db.$transaction(async (tx) => {
    const existing = await tx.grant.findFirst({ where: { identityId: auth.identity.id, clientId: client.id, revokedAt: null } });
    const union = SCOPES.filter((s) => approved.includes(s) || existing?.scopes.includes(s));
    const isNew = !existing || union.length !== existing.scopes.length;
    const grant = existing
      ? await tx.grant.update({ where: { id: existing.id }, data: { scopes: union, lastUsedAt: new Date() } })
      : await tx.grant.create({ data: { identityId: auth.identity.id, clientId: client.id, scopes: union, lastUsedAt: new Date() } });
    await tx.authCode.create({
      data: {
        codeHash: sha256(code),
        grantId: grant.id,
        redirectUri: request.redirectUri,
        scopes: approved,
        nonce: request.nonce,
        codeChallenge: request.codeChallenge,
        authTime: auth.session.authAt,
        amr: auth.session.amr,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });
    if (isNew) {
      await auditIn(tx, { type: "consent.granted", identityId: auth.identity.id, clientId: client.clientId, detail: { scopes: union } });
    }
  });

  return redirectWith(request.redirectUri, { code, state: request.state });
}

// --------------------------------------------------------------------------
// Token endpoint
// --------------------------------------------------------------------------

/** OAuth error for the token and userinfo endpoints (RFC 6749 §5.2). */
export class OAuthError extends Error {
  constructor(public readonly error: string, public readonly description: string, public readonly status = 400) {
    super(error);
  }
}

async function authenticateClient(headers: Headers, form: URLSearchParams): Promise<OidcClient> {
  let clientId = form.get("client_id") ?? "";
  let secret = form.get("client_secret");
  const basic = headers.get("authorization");
  if (basic?.toLowerCase().startsWith("basic ")) {
    const decoded = Buffer.from(basic.slice(6), "base64").toString("utf8");
    const sep = decoded.indexOf(":");
    if (sep < 0) throw new OAuthError("invalid_client", "Malformed Basic credentials.", 401);
    clientId = decodeURIComponent(decoded.slice(0, sep));
    secret = decodeURIComponent(decoded.slice(sep + 1));
  }
  const client = clientId ? await db.oidcClient.findUnique({ where: { clientId } }) : null;
  if (!client) throw new OAuthError("invalid_client", "Unknown client.", 401);
  if (client.type === "CONFIDENTIAL") {
    if (!secret || !client.secretHash || !safeEqual(sha256(secret), client.secretHash)) {
      throw new OAuthError("invalid_client", "Client authentication failed.", 401);
    }
  }
  return client;
}

export async function exchangeCode(headers: Headers, form: URLSearchParams) {
  const client = await authenticateClient(headers, form);
  if (form.get("grant_type") !== "authorization_code") {
    throw new OAuthError("unsupported_grant_type", "Only authorization_code is supported.");
  }
  const code = form.get("code") ?? "";
  const verifier = form.get("code_verifier") ?? "";
  const codeHash = sha256(code);

  const record = await db.authCode.findUnique({ where: { codeHash }, include: { grant: { include: { identity: true } } } });
  if (!record || record.grant.clientId !== client.id) throw new OAuthError("invalid_grant", "The authorization code is not valid.");

  // Single use. A second presentation means the code leaked: revoke the grant.
  const claimed = await db.authCode.updateMany({ where: { codeHash, consumedAt: null }, data: { consumedAt: new Date() } });
  if (claimed.count !== 1) {
    await db.grant.updateMany({ where: { id: record.grantId, revokedAt: null }, data: { revokedAt: new Date() } });
    throw new OAuthError("invalid_grant", "The authorization code was already used.");
  }
  if (record.expiresAt < new Date()) throw new OAuthError("invalid_grant", "The authorization code has expired.");
  if (record.redirectUri !== form.get("redirect_uri")) throw new OAuthError("invalid_grant", "redirect_uri does not match the authorization request.");
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) || createHash("sha256").update(verifier).digest("base64url") !== record.codeChallenge) {
    throw new OAuthError("invalid_grant", "PKCE verification failed.");
  }
  if (record.grant.revokedAt) throw new OAuthError("invalid_grant", "Consent was withdrawn.");

  const identity = await refreshStatus(record.grant.identity);
  if (identity.status !== "ACTIVE") throw new OAuthError("invalid_grant", "The identity is not active.");

  const scopes = parseScopes(record.scopes.join(" "));
  const claims = await claimsFor(identity, client, scopes);
  const sub = claims.sub as string;

  const accessToken = await signJwt(
    { client_id: client.clientId, scope: scopes.join(" "), gid: record.grantId },
    { typ: "at+jwt", expiresInSeconds: TOKEN_TTL_SECONDS, subject: sub, audience: `${env().appUrl}/oauth/userinfo`, jti: randomToken(16) },
  );
  const atHash = createHash("sha256").update(accessToken).digest().subarray(0, 16).toString("base64url");
  const idToken = await signJwt(
    {
      ...claims,
      auth_time: Math.floor(record.authTime.getTime() / 1000),
      acr: "urn:amarid:loa:high",
      amr: record.amr,
      at_hash: atHash,
      ...(record.nonce ? { nonce: record.nonce } : {}),
    },
    { typ: "JWT", expiresInSeconds: TOKEN_TTL_SECONDS, audience: client.clientId },
  );

  await db.$transaction(async (tx) => {
    await tx.grant.update({ where: { id: record.grantId }, data: { lastUsedAt: new Date() } });
    await auditIn(tx, { type: "partner.signed_in", identityId: identity.id, clientId: client.clientId, detail: { scopes } });
  });

  return { access_token: accessToken, token_type: "Bearer", expires_in: TOKEN_TTL_SECONDS, scope: scopes.join(" "), id_token: idToken };
}

// --------------------------------------------------------------------------
// UserInfo
// --------------------------------------------------------------------------

export async function userInfo(authorization: string | null) {
  const token = authorization?.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
  if (!token) throw new OAuthError("invalid_token", "A bearer access token is required.", 401);

  let payload;
  try {
    const verified = await jwtVerify(token, async (header) => {
      const key = await publicKeyFor(header.kid);
      if (!key) throw new Error("unknown key");
      return key;
    }, { issuer: env().appUrl, audience: `${env().appUrl}/oauth/userinfo`, algorithms: ["ES256"], typ: "at+jwt" });
    payload = verified.payload;
  } catch {
    throw new OAuthError("invalid_token", "The access token is invalid or expired.", 401);
  }

  const grant = await db.grant.findUnique({ where: { id: String(payload.gid) }, include: { identity: true, client: true } });
  if (!grant || grant.revokedAt) throw new OAuthError("invalid_token", "Consent was withdrawn.", 401);
  const identity = await refreshStatus(grant.identity);
  if (identity.status !== "ACTIVE") throw new OAuthError("invalid_token", "The identity is not active.", 401);
  if (payload.sub !== pairwiseSubject(identity.id, grant.client.sector)) throw new OAuthError("invalid_token", "Subject mismatch.", 401);

  // Never more than the grant currently allows, even if the token was issued with more.
  const scopes = parseScopes(String(payload.scope)).filter((s) => grant.scopes.includes(s));
  return claimsFor(identity, grant.client, scopes);
}

// --------------------------------------------------------------------------
// Consent management (the citizen's side)
// --------------------------------------------------------------------------

export async function revokeGrant(identityId: string, grantId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const grant = await tx.grant.findFirst({ where: { id: grantId, identityId, revokedAt: null }, include: { client: true } });
    if (!grant) throw new AppError("NOT_FOUND", 404);
    await tx.grant.update({ where: { id: grant.id }, data: { revokedAt: new Date() } });
    await tx.authCode.deleteMany({ where: { grantId: grant.id } });
    await auditIn(tx, { type: "consent.revoked", identityId, clientId: grant.client.clientId, detail: { scopes: grant.scopes } });
  });
}
