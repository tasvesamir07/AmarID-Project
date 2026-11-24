import { randomInt } from "node:crypto";
import { smsGateway } from "./adapters";
import { keyedHash, safeEqual } from "./crypto/tokens";
import { db } from "./db";
import { AppError } from "./errors";
import { rateLimit } from "./ratelimit";

const TTL_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;

/**
 * One-time codes over SMS.
 *  - The code is stored only as a keyed hash, bound to the challenge id.
 *  - A challenge is bound to a subject (one enrollment or recovery attempt) and
 *    to the phone number it was sent to; a code for one cannot verify another.
 *  - Five wrong guesses burn the challenge. Sends are rate limited per number
 *    and per network address.
 *  - The code is never returned by the API. In sandbox mode the message lands
 *    in the on-screen "sandbox phone", which reads the simulated SMS inbox.
 */
export async function sendOtp(params: { subject: string; msisdn: string; ip: string }): Promise<{ expiresAt: string }> {
  await rateLimit(`otp:phone:${keyedHash("rate", params.msisdn)}`, 5, 3600);
  await rateLimit(`otp:ip:${params.ip}`, 20, 3600);

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = new Date(Date.now() + TTL_MS);

  // Only the newest code for a subject is valid.
  await db.challenge.updateMany({
    where: { kind: "OTP", subject: params.subject, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  const challenge = await db.challenge.create({
    data: { kind: "OTP", subject: params.subject, data: {}, expiresAt },
  });
  await db.challenge.update({
    where: { id: challenge.id },
    data: { data: { msisdn: params.msisdn, codeHash: keyedHash("otp", `${challenge.id}:${code}`) } },
  });

  await smsGateway().send(
    params.msisdn,
    `${code} is your AmarID verification code. It expires in 5 minutes. AmarID will never ask you for this code by phone.`,
  );
  return { expiresAt: expiresAt.toISOString() };
}

export async function verifyOtp(params: { subject: string; msisdn: string; code: string }): Promise<void> {
  const challenge = await db.challenge.findFirst({
    where: { kind: "OTP", subject: params.subject, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) throw new AppError("OTP_EXPIRED", 400);

  const data = challenge.data as { msisdn?: string; codeHash?: string };
  // Count the attempt before comparing, so parallel guesses cannot exceed the limit.
  const counted = await db.challenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
  if (counted.attempts > MAX_ATTEMPTS) {
    await db.challenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
    throw new AppError("OTP_TOO_MANY_ATTEMPTS", 429);
  }

  const expected = keyedHash("otp", `${challenge.id}:${params.code}`);
  if (data.msisdn !== params.msisdn || !data.codeHash || !safeEqual(data.codeHash, expected)) {
    throw new AppError("OTP_INCORRECT", 400, undefined, { attemptsLeft: MAX_ATTEMPTS - counted.attempts });
  }

  const claimed = await db.challenge.updateMany({
    where: { id: challenge.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (claimed.count !== 1) throw new AppError("OTP_EXPIRED", 400);
}
