import { decodeProtectedHeader, jwtVerify } from "jose";
import { isPassClaim, PASS_CLAIMS, type PassClaim } from "@/lib/pass-claims";
import { audit, auditIn } from "./audit";
import { db } from "./db";
import { env } from "./env";
import { AppError } from "./errors";
import { profileOf, refreshStatus } from "./identity";
import { publicKeyFor, signJwt } from "./oidc/keys";

/**
 * Verification pass — for platforms that are not AmarID partners, typically
 * foreign ones that today ask for a photo of the NID or passport.
 *
 * The citizen picks a few facts ("real unique person", "over 18", …), a label
 * and a lifetime. AmarID signs a token that carries exactly those facts and a
 * random pass id — no Universal ID, no document number, no date of birth.
 *
 * A verifier can check it two ways:
 *   - offline, with the public key from /oauth/jwks (signature + expiry), or
 *   - online, at /api/passes/check, which also reports revocation and whether
 *     the identity behind it is still active.
 *
 * Each pass has its own id, so two platforms cannot correlate the person by
 * comparing passes.
 */

const TYP = "amarid-pass+jwt";
const DAY = 86_400_000;

export type PassFacts = Partial<Record<PassClaim, boolean | string>>;

function factsFor(identity: Parameters<typeof profileOf>[0], claims: PassClaim[]): PassFacts {
  const profile = profileOf(identity);
  const facts: PassFacts = {};
  for (const claim of claims) {
    if (claim === "real_person") facts.real_person = true; // enrolled with liveness and face-uniqueness
    if (claim === "age_over_18") facts.age_over_18 = profile.age >= 18;
    if (claim === "bangladesh_id_holder") facts.bangladesh_id_holder = true;
    if (claim === "recently_verified") facts.recently_verified = Date.now() - identity.lastLivenessAt.getTime() < 365 * DAY;
    if (claim === "name") facts.name = profile.name;
  }
  return facts;
}

async function tokenFor(passId: string, identity: Parameters<typeof profileOf>[0], claims: PassClaim[], expiresAt: Date): Promise<string> {
  return signJwt(
    { facts: factsFor(identity, claims) },
    { typ: TYP, jti: passId, expiresInSeconds: Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000)) },
  );
}

export async function createPass(identityId: string, input: { label: string; claims: string[]; minutes: number }) {
  const claims = PASS_CLAIMS.filter((c) => input.claims.includes(c));
  if (claims.length === 0) throw new AppError("INVALID_REQUEST", 400);
  const identity = await db.identity.findUniqueOrThrow({ where: { id: identityId } });
  if (identity.status !== "ACTIVE") throw new AppError("IDENTITY_NOT_ACTIVE", 403);

  const expiresAt = new Date(Date.now() + input.minutes * 60_000);
  const pass = await db.$transaction(async (tx) => {
    const row = await tx.verificationPass.create({ data: { identityId, label: input.label, claims, expiresAt } });
    await auditIn(tx, { type: "pass.created", identityId, detail: { pass: row.id, claims, minutes: input.minutes } });
    return row;
  });
  return { id: pass.id, token: await tokenFor(pass.id, identity, claims, expiresAt), expiresAt: expiresAt.toISOString() };
}

/** Re-issues the token for a pass the citizen wants to show again. */
export async function passToken(identityId: string, passId: string): Promise<string> {
  const pass = await db.verificationPass.findFirst({ where: { id: passId, identityId, revokedAt: null, expiresAt: { gt: new Date() } }, include: { identity: true } });
  if (!pass) throw new AppError("NOT_FOUND", 404);
  return tokenFor(pass.id, pass.identity, pass.claims.filter(isPassClaim), pass.expiresAt);
}

export async function revokePass(identityId: string, passId: string): Promise<void> {
  const done = await db.verificationPass.updateMany({ where: { id: passId, identityId, revokedAt: null }, data: { revokedAt: new Date() } });
  if (done.count !== 1) throw new AppError("NOT_FOUND", 404);
  await audit({ type: "pass.revoked", identityId, detail: { pass: passId } });
}

export type PassCheck =
  | { valid: true; issuer: string; label: string; facts: PassFacts; issuedAt: string; expiresAt: string }
  | { valid: false; reason: "MALFORMED" | "BAD_SIGNATURE" | "EXPIRED" | "REVOKED" | "IDENTITY_INACTIVE" };

/** Public, online verification. Facts are re-evaluated now, not read from the token. */
export async function checkPass(token: string): Promise<PassCheck> {
  let passId: string;
  try {
    if (decodeProtectedHeader(token).typ !== TYP) return { valid: false, reason: "MALFORMED" };
    const { payload } = await jwtVerify(token, async (header) => {
      const key = await publicKeyFor(header.kid);
      if (!key) throw new Error("unknown key");
      return key;
    }, { issuer: env().appUrl, algorithms: ["ES256"], typ: TYP });
    passId = String(payload.jti);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ERR_JWT_EXPIRED") return { valid: false, reason: "EXPIRED" };
    return { valid: false, reason: code?.startsWith("ERR_JWS") || code === "ERR_JWT_CLAIM_VALIDATION_FAILED" ? "BAD_SIGNATURE" : "MALFORMED" };
  }

  const pass = await db.verificationPass.findUnique({ where: { id: passId }, include: { identity: true } });
  if (!pass) return { valid: false, reason: "MALFORMED" };
  if (pass.revokedAt) return { valid: false, reason: "REVOKED" };
  if (pass.expiresAt < new Date()) return { valid: false, reason: "EXPIRED" };
  const identity = await refreshStatus(pass.identity);
  if (identity.status !== "ACTIVE") return { valid: false, reason: "IDENTITY_INACTIVE" };

  await db.$transaction(async (tx) => {
    await tx.verificationPass.update({ where: { id: pass.id }, data: { checks: { increment: 1 } } });
    await auditIn(tx, { type: "pass.checked", identityId: identity.id, detail: { pass: pass.id } });
  });

  return {
    valid: true,
    issuer: env().appUrl,
    label: pass.label,
    facts: factsFor(identity, pass.claims.filter(isPassClaim)),
    issuedAt: pass.createdAt.toISOString(),
    expiresAt: pass.expiresAt.toISOString(),
  };
}
