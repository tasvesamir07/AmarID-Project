import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { env } from "./env";
import { AppError } from "./errors";

/**
 * Passkeys (WebAuthn) are the everyday sign-in: the private key never leaves
 * the citizen's device and is unlocked there by fingerprint, face or screen
 * lock. The server only ever sees a public key and signatures.
 *
 *  - User verification is required on every ceremony, so possession of the
 *    device alone is not enough.
 *  - Credentials are discoverable: sign-in needs no username.
 *  - Signing in on a device without a passkey uses the browser's own
 *    cross-device flow (QR code + Bluetooth proximity check), which is what
 *    stops a remote attacker from relaying the ceremony.
 */

const TTL_MS = 5 * 60_000;

export type NewCredential = {
  credentialId: string;
  publicKey: Uint8Array<ArrayBuffer>;
  counter: bigint;
  transports: string[];
  deviceType: string;
  backedUp: boolean;
};

export async function registrationOptions(params: {
  subject: string;
  userId: string;
  universalId: string;
  exclude?: { credentialId: string; transports: string[] }[];
  extra?: Prisma.InputJsonObject;
}) {
  const options = await generateRegistrationOptions({
    rpName: "AmarID",
    rpID: env().rpId,
    userID: new TextEncoder().encode(params.userId),
    // Shown in the device's passkey picker and possibly synced to the platform
    // vendor's cloud, so it carries the Universal ID only — never the name.
    userName: params.universalId,
    userDisplayName: params.universalId,
    attestationType: "none",
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
    excludeCredentials: (params.exclude ?? []).map((c) => ({
      id: c.credentialId,
      transports: c.transports as AuthenticatorTransportFuture[],
    })),
    supportedAlgorithmIDs: [-7, -257],
  });
  await db.challenge.updateMany({
    where: { kind: "WEBAUTHN_REGISTRATION", subject: params.subject, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await db.challenge.create({
    data: {
      kind: "WEBAUTHN_REGISTRATION",
      subject: params.subject,
      data: { ...params.extra, challenge: options.challenge },
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });
  return options;
}

export async function verifyRegistration(subject: string, response: RegistrationResponseJSON) {
  const challenge = await db.challenge.findFirst({
    where: { kind: "WEBAUTHN_REGISTRATION", subject, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) throw new AppError("PASSKEY_CHALLENGE_EXPIRED", 400);
  const data = challenge.data as Record<string, unknown> & { challenge: string };

  let result;
  try {
    result = await verifyRegistrationResponse({
      response,
      expectedChallenge: data.challenge,
      expectedOrigin: env().origin,
      expectedRPID: env().rpId,
      requireUserVerification: true,
    });
  } catch {
    throw new AppError("PASSKEY_REJECTED", 400);
  }
  if (!result.verified || !result.registrationInfo) throw new AppError("PASSKEY_REJECTED", 400);

  const claimed = await db.challenge.updateMany({ where: { id: challenge.id, consumedAt: null }, data: { consumedAt: new Date() } });
  if (claimed.count !== 1) throw new AppError("PASSKEY_CHALLENGE_EXPIRED", 400);

  const info = result.registrationInfo;
  const credential: NewCredential = {
    credentialId: info.credential.id,
    publicKey: new Uint8Array(info.credential.publicKey),
    counter: BigInt(info.credential.counter),
    transports: info.credential.transports ?? [],
    deviceType: info.credentialDeviceType,
    backedUp: info.credentialBackedUp,
  };
  return { credential, data };
}

export async function authenticationOptions() {
  const options = await generateAuthenticationOptions({ rpID: env().rpId, userVerification: "required", allowCredentials: [] });
  const challenge = await db.challenge.create({
    data: {
      kind: "WEBAUTHN_AUTHENTICATION",
      subject: "sign-in",
      data: { challenge: options.challenge },
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });
  return { attemptId: challenge.id, options };
}

/** Returns the identity that owns the passkey used. */
export async function verifyAuthentication(attemptId: string, response: AuthenticationResponseJSON): Promise<{ identityId: string }> {
  const claimed = await db.challenge.updateMany({
    where: { id: attemptId, kind: "WEBAUTHN_AUTHENTICATION", consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() },
  });
  if (claimed.count !== 1) throw new AppError("PASSKEY_CHALLENGE_EXPIRED", 400);
  const challenge = await db.challenge.findUniqueOrThrow({ where: { id: attemptId } });

  const passkey = await db.passkey.findUnique({ where: { credentialId: response.id } });
  if (!passkey || passkey.revokedAt) throw new AppError("PASSKEY_UNKNOWN", 401);

  let result;
  try {
    result = await verifyAuthenticationResponse({
      response,
      expectedChallenge: (challenge.data as { challenge: string }).challenge,
      expectedOrigin: env().origin,
      expectedRPID: env().rpId,
      requireUserVerification: true,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports as AuthenticatorTransportFuture[],
      },
    });
  } catch {
    throw new AppError("PASSKEY_REJECTED", 401);
  }
  if (!result.verified) throw new AppError("PASSKEY_REJECTED", 401);

  await db.passkey.update({
    where: { id: passkey.id },
    data: { counter: BigInt(result.authenticationInfo.newCounter), lastUsedAt: new Date() },
  });
  return { identityId: passkey.identityId };
}

/** A short, human label for the device list, derived from the user agent. */
export function deviceLabel(userAgent: string | null): string {
  const ua = userAgent ?? "";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iPhone / iPad" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  return browser ? `${os} · ${browser}` : os;
}
