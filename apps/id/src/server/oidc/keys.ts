import { randomBytes } from "node:crypto";
import { exportJWK, generateKeyPair, importJWK, SignJWT, type JWK } from "jose";
import type { Prisma } from "@/generated/prisma/client";
import { open, seal } from "../crypto/seal";
import { db } from "../db";
import { env } from "../env";

/**
 * Token signing keys (ES256).
 *
 * The private key is generated once, sealed with the master key and stored, so
 * every instance signs with the same key and a restart does not invalidate
 * tokens or break partners' cached JWKS. Rotation = insert a new key and set
 * `retiredAt` on the old one; retired keys stay in the JWKS until their tokens
 * have expired.
 */

type Loaded = { kid: string; privateKey: CryptoKey };
let active: Loaded | undefined;

const context = (kid: string) => `signing-key:${kid}`;

async function load(): Promise<Loaded> {
  if (active) return active;
  let row = await db.signingKey.findFirst({ where: { retiredAt: null }, orderBy: { createdAt: "desc" } });
  if (!row) {
    const { publicKey, privateKey } = await generateKeyPair("ES256", { extractable: true });
    const kid = `amarid-${new Date().toISOString().slice(0, 10)}-${randomBytes(4).toString("hex")}`;
    const publicJwk = { ...(await exportJWK(publicKey)), kid, alg: "ES256", use: "sig" };
    const privateJwk = await exportJWK(privateKey);
    try {
      row = await db.signingKey.create({
        data: { kid, alg: "ES256", publicJwk: publicJwk as Prisma.InputJsonObject, privateSealed: seal(JSON.stringify(privateJwk), context(kid)) },
      });
    } catch {
      // Another instance created the first key at the same moment; use that one.
      row = await db.signingKey.findFirstOrThrow({ where: { retiredAt: null }, orderBy: { createdAt: "desc" } });
    }
  }
  const privateJwk = JSON.parse(open(row.privateSealed, context(row.kid)).toString("utf8")) as JWK;
  active = { kid: row.kid, privateKey: (await importJWK(privateJwk, "ES256")) as CryptoKey };
  return active;
}

export async function jwks(): Promise<{ keys: JWK[] }> {
  await load();
  const monthAgo = new Date(Date.now() - 30 * 86_400_000);
  const rows = await db.signingKey.findMany({ where: { OR: [{ retiredAt: null }, { retiredAt: { gt: monthAgo } }] } });
  return { keys: rows.map((r) => r.publicJwk as unknown as JWK) };
}

export async function publicKeyFor(kid: string | undefined): Promise<CryptoKey | null> {
  if (!kid) return null;
  const row = await db.signingKey.findUnique({ where: { kid } });
  return row ? ((await importJWK(row.publicJwk as unknown as JWK, "ES256")) as CryptoKey) : null;
}

export async function signJwt(claims: Record<string, unknown>, options: { typ: string; expiresInSeconds: number; subject?: string; audience?: string; jti?: string }): Promise<string> {
  const key = await load();
  const now = Math.floor(Date.now() / 1000);
  let jwt = new SignJWT(claims)
    .setProtectedHeader({ alg: "ES256", kid: key.kid, typ: options.typ })
    .setIssuer(env().appUrl)
    .setIssuedAt(now)
    .setExpirationTime(now + options.expiresInSeconds);
  if (options.subject) jwt = jwt.setSubject(options.subject);
  if (options.audience) jwt = jwt.setAudience(options.audience);
  if (options.jti) jwt = jwt.setJti(options.jti);
  return jwt.sign(key.privateKey);
}
