import { createHmac } from "node:crypto";
import { parseScopes, type Scope } from "@/lib/scopes";
import { audit } from "./audit";
import { deriveKey } from "./crypto/keys";
import { randomToken, safeEqual, sha256 } from "./crypto/tokens";
import { db } from "./db";
import { env } from "./env";
import { AppError } from "./errors";
import { rateLimit } from "./ratelimit";
import { clearCookie, readCookie, setCookie } from "./session";

/**
 * Operator console access. One shared operator secret is enough for a pilot;
 * the cookie is a signed expiry, so there is no operator table to manage.
 * Production replaces this with staff SSO and per-operator audit identities.
 */

const COOKIE = "amarid_admin";
const TTL_MS = 2 * 3600_000;

const sign = (expires: string) => createHmac("sha256", deriveKey("admin-session")).update(expires).digest("base64url");

export async function adminSignIn(token: string, ip: string): Promise<void> {
  await rateLimit(`admin:ip:${ip}`, 8, 900);
  if (!safeEqual(sha256(token), sha256(env().adminToken))) throw new AppError("ADMIN_TOKEN_WRONG", 401);
  const expires = String(Date.now() + TTL_MS);
  await setCookie(COOKIE, `${expires}.${sign(expires)}`, TTL_MS / 1000);
}

export async function isAdmin(): Promise<boolean> {
  const value = await readCookie(COOKIE);
  if (!value) return false;
  const [expires, mac] = value.split(".");
  return !!expires && !!mac && safeEqual(mac, sign(expires)) && Number(expires) > Date.now();
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new AppError("ADMIN_REQUIRED", 401);
}

export const adminSignOut = () => clearCookie(COOKIE);

export async function overview() {
  const [byStatus, enrollments, duplicates, grants, partnerSignIns, passes, clients] = await Promise.all([
    db.identity.groupBy({ by: ["status"], _count: true }),
    db.auditEvent.count({ where: { type: "enrollment.started" } }),
    db.auditEvent.count({ where: { type: "enrollment.duplicate_blocked" } }),
    db.grant.count({ where: { revokedAt: null } }),
    db.auditEvent.count({ where: { type: "partner.signed_in" } }),
    db.verificationPass.count(),
    db.oidcClient.count(),
  ]);
  const status = Object.fromEntries(byStatus.map((s) => [s.status, s._count])) as Record<string, number>;
  return {
    identities: { active: status.ACTIVE ?? 0, dormant: status.DORMANT ?? 0, suspended: status.SUSPENDED ?? 0, deceased: status.DECEASED ?? 0 },
    enrollmentsStarted: enrollments,
    duplicatesBlocked: duplicates,
    activeConsents: grants,
    partnerSignIns,
    passes,
    partners: clients,
  };
}

export async function registerClient(input: { name: string; description: string; category: string; redirectUris: string[]; scopes: string; confidential: boolean }) {
  for (const uri of input.redirectUris) {
    let url: URL;
    try {
      url = new URL(uri);
    } catch {
      throw new AppError("REDIRECT_URI_INVALID", 400);
    }
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.hash || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) throw new AppError("REDIRECT_URI_INVALID", 400);
  }
  const allowedScopes: Scope[] = parseScopes(`openid ${input.scopes}`);
  const clientId = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "client"}-${randomToken(4).toLowerCase().replace(/[^a-z0-9]/g, "x")}`;
  const secret = input.confidential ? randomToken(32) : null;
  const client = await db.oidcClient.create({
    data: {
      clientId,
      name: input.name,
      description: input.description,
      category: input.category,
      type: input.confidential ? "CONFIDENTIAL" : "PUBLIC",
      secretHash: secret ? sha256(secret) : null,
      redirectUris: input.redirectUris,
      allowedScopes,
      sector: clientId,
      verified: false,
    },
  });
  await audit({ type: "partner.registered", clientId, detail: { scopes: allowedScopes, type: client.type } });
  // The secret is shown once and never stored in readable form.
  return { clientId, clientSecret: secret };
}
