import { db } from "./db";
import { AppError } from "./errors";

/**
 * Fixed-window counter in PostgreSQL. One atomic upsert per check, so it is
 * correct across several app instances without an extra cache service.
 */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<void> {
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateBucket" ("key", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "RateBucket"."count" + 1
    RETURNING "count"`;
  if ((rows[0]?.count ?? 0) > max) {
    const retryAfter = Math.ceil((windowStart.getTime() + windowMs - Date.now()) / 1000);
    throw new AppError("RATE_LIMITED", 429, undefined, { retryAfter });
  }
}

/** Housekeeping for expiring rows; safe to call from any request. */
export async function purgeExpired(): Promise<void> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 86_400_000);
  await db.$transaction([
    db.rateBucket.deleteMany({ where: { windowStart: { lt: dayAgo } } }),
    db.challenge.deleteMany({ where: { expiresAt: { lt: dayAgo } } }),
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.authCode.deleteMany({ where: { expiresAt: { lt: dayAgo } } }),
    db.enrollment.deleteMany({ where: { expiresAt: { lt: now }, state: { not: "ISSUED" } } }),
    db.sandboxMessage.deleteMany({ where: { createdAt: { lt: dayAgo } } }),
  ]);
}
