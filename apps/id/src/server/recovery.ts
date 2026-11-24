import type { LivenessChallenge } from "@/lib/liveness";
import { audit } from "./audit";
import { issueLivenessChallenge, verifyLivenessEvidence } from "./biometrics/liveness";
import { matchIdentity } from "./biometrics/match";
import { blindIndex, randomToken, sha256 } from "./crypto/tokens";
import { db } from "./db";
import { AppError } from "./errors";
import { refreshStatus } from "./identity";
import { sendOtp, verifyOtp } from "./otp";
import { rateLimit } from "./ratelimit";
import { clearCookie, createSession, readCookie, setCookie } from "./session";

/**
 * Signing in without a passkey — a new phone, a lost phone, or a borrowed
 * computer. The person proves two things the enrollment bound together:
 *
 *   1. they hold the SIM registered to the identity (one-time code), and
 *   2. they are the enrolled person (live face, matched 1:1 against the
 *      protected template).
 *
 * Neither alone is enough: a SIM swap fails the face check, a look-alike fails
 * the SIM check. The same flow re-activates nobody: a dormant identity can sign
 * in to renew its proof of life, a suspended or deceased one cannot.
 *
 * The first step always answers the same way, whether or not the Universal ID
 * and phone belong together, so it cannot be used to test guesses.
 */

const COOKIE = "amarid_recover";
const TTL_MS = 15 * 60_000;

type State = { identityId: string | null; msisdn: string; stage: "OTP" | "FACE" };

async function current() {
  const token = await readCookie(COOKIE);
  if (!token) throw new AppError("RECOVERY_EXPIRED", 409);
  const row = await db.challenge.findFirst({
    where: { kind: "RECOVERY", subject: sha256(token), consumedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!row) throw new AppError("RECOVERY_EXPIRED", 409);
  return { row, state: row.data as State };
}

export async function startRecovery(input: { universalId: string; msisdn: string; ip: string }): Promise<{ expiresAt: string }> {
  await rateLimit(`recover:ip:${input.ip}`, 10, 3600);

  const identity = await db.identity.findUnique({ where: { universalId: input.universalId }, include: { phones: true } });
  const phoneIndex = blindIndex("phone", input.msisdn);
  const owns = !!identity && identity.phones.some((p) => p.phoneIndex === phoneIndex);
  const usable = owns && identity.status !== "DECEASED" && identity.status !== "SUSPENDED";

  const token = randomToken();
  const expiresAt = new Date(Date.now() + TTL_MS);
  const row = await db.challenge.create({
    data: {
      kind: "RECOVERY",
      subject: sha256(token),
      data: { identityId: usable ? identity!.id : null, msisdn: input.msisdn, stage: "OTP" } satisfies State,
      expiresAt,
    },
  });
  await setCookie(COOKIE, token, TTL_MS / 1000);

  // A code is only sent when the pair is genuine. The response is identical either way.
  if (usable) await sendOtp({ subject: row.id, msisdn: input.msisdn, ip: input.ip });
  return { expiresAt: expiresAt.toISOString() };
}

export async function confirmRecoveryCode(code: string): Promise<void> {
  const { row, state } = await current();
  if (state.stage !== "OTP") throw new AppError("RECOVERY_WRONG_STEP", 409);
  if (!state.identityId) {
    // Behave exactly like a wrong code for a real attempt.
    const counted = await db.challenge.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    if (counted.attempts >= 5) await db.challenge.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
    throw new AppError("OTP_INCORRECT", 400, undefined, { attemptsLeft: Math.max(0, 5 - counted.attempts) });
  }
  await verifyOtp({ subject: row.id, msisdn: state.msisdn, code });
  await db.challenge.update({ where: { id: row.id }, data: { data: { ...state, stage: "FACE" } } });
}

export async function recoveryLivenessChallenge(): Promise<LivenessChallenge> {
  const { row, state } = await current();
  if (state.stage !== "FACE" || !state.identityId) throw new AppError("RECOVERY_WRONG_STEP", 409);
  return issueLivenessChallenge(row.id);
}

export async function completeRecovery(evidence: unknown, userAgent: string | null): Promise<void> {
  const { row, state } = await current();
  if (state.stage !== "FACE" || !state.identityId) throw new AppError("RECOVERY_WRONG_STEP", 409);

  const { embedding } = await verifyLivenessEvidence(row.id, evidence);
  const result = await matchIdentity(embedding, state.identityId);
  if (!result.matched) {
    const counted = await db.challenge.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    if (counted.attempts >= 3) {
      await db.challenge.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
      await clearCookie(COOKIE);
    }
    throw new AppError("FACE_NOT_MATCHED", 403);
  }

  const identity = await refreshStatus(await db.identity.findUniqueOrThrow({ where: { id: state.identityId } }));
  if (identity.status === "DECEASED" || identity.status === "SUSPENDED") throw new AppError("IDENTITY_NOT_ACTIVE", 403);

  await db.challenge.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
  await clearCookie(COOKIE);
  await audit({ type: "auth.recovered", identityId: identity.id, detail: { factors: ["sim_otp", "face_match"] } });
  await createSession({ identityId: identity.id, amr: ["face", "otp"], userAgent });
}

/** The phone number of the recovery in progress — used only by the sandbox inbox. */
export async function recoveryPhone(): Promise<string | null> {
  try {
    const { state } = await current();
    return state.identityId ? state.msisdn : null;
  } catch {
    return null;
  }
}
