import { cookies } from "next/headers";
import type { Identity, Session } from "@/generated/prisma/client";
import { audit } from "./audit";
import { randomToken, sha256 } from "./crypto/tokens";
import { db } from "./db";
import { env } from "./env";
import { unauthorized } from "./errors";
import { refreshStatus } from "./identity";

const SESSION_TTL_MS = 8 * 3600_000;

/** `__Host-` pins the cookie to this exact origin; browsers only accept it over HTTPS. */
export const cookieName = (base: string) => (env().secureCookies ? `__Host-${base}` : base);

export async function setCookie(base: string, value: string, maxAgeSeconds: number): Promise<void> {
  (await cookies()).set(cookieName(base), value, {
    httpOnly: true,
    sameSite: "lax",
    secure: env().secureCookies,
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function readCookie(base: string): Promise<string | undefined> {
  return (await cookies()).get(cookieName(base))?.value;
}

export async function clearCookie(base: string): Promise<void> {
  (await cookies()).delete(cookieName(base));
}

/**
 * Sessions are opaque random tokens. Only a SHA-256 of the token is stored, so
 * a database leak does not hand out working sessions, and a session can be
 * revoked at any moment (unlike a self-contained JWT).
 */
export async function createSession(params: { identityId: string; amr: string[]; userAgent: string | null }): Promise<void> {
  const token = randomToken();
  await db.session.create({
    data: {
      tokenHash: sha256(token),
      identityId: params.identityId,
      amr: params.amr,
      userAgent: params.userAgent,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  await setCookie("amarid_session", token, SESSION_TTL_MS / 1000);
  await audit({ type: "auth.signed_in", identityId: params.identityId, detail: { amr: params.amr } });
}

export type Authenticated = { session: Session; identity: Identity };

export async function getSession(): Promise<Authenticated | null> {
  const token = await readCookie("amarid_session");
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: sha256(token) }, include: { identity: true } });
  if (!session || session.expiresAt < new Date()) return null;
  const identity = await refreshStatus(session.identity);
  if (identity.status === "DECEASED" || identity.status === "SUSPENDED") return null;
  const { identity: _omit, ...rest } = session;
  return { session: rest, identity };
}

export async function requireSession(): Promise<Authenticated> {
  const auth = await getSession();
  if (!auth) throw unauthorized();
  return auth;
}

export async function destroySession(): Promise<void> {
  const token = await readCookie("amarid_session");
  if (token) {
    const session = await db.session.findUnique({ where: { tokenHash: sha256(token) } });
    if (session) {
      await db.session.delete({ where: { id: session.id } });
      await audit({ type: "auth.signed_out", identityId: session.identityId });
    }
  }
  await clearCookie("amarid_session");
}
