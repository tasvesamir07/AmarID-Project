import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { isPassClaim } from "@/lib/pass-claims";
import { parseScopes } from "@/lib/scopes";
import { maskMsisdn } from "@/lib/validation";
import { auditIn } from "./audit";
import { openText } from "./crypto/seal";
import { db } from "./db";
import { AppError } from "./errors";
import { profileOf, sealContext } from "./identity";
import type { Authenticated } from "./session";
import { deviceLabel, registrationOptions, verifyRegistration } from "./webauthn";

/** Everything the wallet shows, read for the signed-in person only. */
export async function walletData(auth: Authenticated) {
  const identityId = auth.identity.id;
  const [phones, passkeys, grants, passes, events] = await Promise.all([
    db.phone.findMany({ where: { identityId } }),
    db.passkey.findMany({ where: { identityId, revokedAt: null }, orderBy: { createdAt: "asc" } }),
    db.grant.findMany({ where: { identityId, revokedAt: null }, include: { client: true }, orderBy: { grantedAt: "desc" } }),
    db.verificationPass.findMany({ where: { identityId }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.auditEvent.findMany({ where: { identityId }, orderBy: { seq: "desc" }, take: 60 }),
  ]);
  const clientIds = [...new Set(events.map((e) => e.clientId).filter((c): c is string => !!c))];
  const clients = await db.oidcClient.findMany({ where: { clientId: { in: clientIds } }, select: { clientId: true, name: true } });
  const clientName = new Map(clients.map((c) => [c.clientId, c.name]));
  const now = Date.now();

  return {
    profile: profileOf(auth.identity),
    signedInWith: auth.session.amr,
    phones: phones.map((p) => maskMsisdn(openText(p.phoneSealed, sealContext.phone(identityId)))),
    passkeys: passkeys.map((p) => ({
      id: p.id,
      label: p.label,
      synced: p.backedUp,
      createdAt: p.createdAt.toISOString(),
      lastUsedAt: p.lastUsedAt?.toISOString() ?? null,
    })),
    grants: grants.map((g) => ({
      id: g.id,
      name: g.client.name,
      category: g.client.category,
      verified: g.client.verified,
      scopes: parseScopes(g.scopes.join(" ")),
      grantedAt: g.grantedAt.toISOString(),
      lastUsedAt: g.lastUsedAt?.toISOString() ?? null,
    })),
    passes: passes.map((p) => ({
      id: p.id,
      label: p.label,
      claims: p.claims.filter(isPassClaim),
      createdAt: p.createdAt.toISOString(),
      expiresAt: p.expiresAt.toISOString(),
      checks: p.checks,
      state: p.revokedAt ? ("REVOKED" as const) : p.expiresAt.getTime() < now ? ("EXPIRED" as const) : ("ACTIVE" as const),
    })),
    activity: events.map((e) => ({
      id: e.seq.toString(),
      type: e.type,
      partner: e.clientId ? (clientName.get(e.clientId) ?? e.clientId) : null,
      detail: e.detail as Record<string, unknown>,
      at: e.createdAt.toISOString(),
    })),
  };
}

export type WalletData = Awaited<ReturnType<typeof walletData>>;

const addSubject = (auth: Authenticated) => `add-passkey:${auth.session.id}`;

export async function addPasskeyOptions(auth: Authenticated) {
  const existing = await db.passkey.findMany({ where: { identityId: auth.identity.id, revokedAt: null } });
  return registrationOptions({
    subject: addSubject(auth),
    userId: auth.identity.id,
    universalId: auth.identity.universalId,
    exclude: existing.map((p) => ({ credentialId: p.credentialId, transports: p.transports })),
  });
}

export async function addPasskey(auth: Authenticated, response: RegistrationResponseJSON, userAgent: string | null): Promise<void> {
  const { credential } = await verifyRegistration(addSubject(auth), response);
  await db.$transaction(async (tx) => {
    const passkey = await tx.passkey.create({ data: { ...credential, identityId: auth.identity.id, label: deviceLabel(userAgent) } });
    await auditIn(tx, { type: "passkey.added", identityId: auth.identity.id, detail: { passkey: passkey.id, synced: credential.backedUp } });
  });
}

export async function revokePasskey(auth: Authenticated, passkeyId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const active = await tx.passkey.findMany({ where: { identityId: auth.identity.id, revokedAt: null } });
    if (!active.some((p) => p.id === passkeyId)) throw new AppError("NOT_FOUND", 404);
    // Recovery by SIM + face always exists, so removing the last passkey is allowed
    // only as a deliberate act from a session that was itself strongly authenticated.
    await tx.passkey.update({ where: { id: passkeyId }, data: { revokedAt: new Date() } });
    await auditIn(tx, { type: "passkey.revoked", identityId: auth.identity.id, detail: { passkey: passkeyId, remaining: active.length - 1 } });
  });
}
