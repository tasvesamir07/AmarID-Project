import type { LivenessChallenge } from "@/lib/liveness";
import { auditIn } from "./audit";
import { issueLivenessChallenge, verifyLivenessEvidence } from "./biometrics/liveness";
import { matchIdentity } from "./biometrics/match";
import { db } from "./db";
import { AppError } from "./errors";
import { nextLivenessDue } from "./identity";
import type { Authenticated } from "./session";

/**
 * Periodic proof of life.
 *
 * An AmarID stays ACTIVE only while its holder keeps showing up: once per cycle
 * the enrolled person passes a liveness check that matches their template.
 * When the check is overdue beyond the grace period the identity turns DORMANT
 * (see identity.refreshStatus): partner sign-ins and passes stop working, so a
 * dead or abandoned identity cannot be operated by whoever holds the phone.
 * A successful check restores it.
 */

export function proofOfLifeChallenge(auth: Authenticated): Promise<LivenessChallenge> {
  return issueLivenessChallenge(`proof-of-life:${auth.session.id}`);
}

export async function completeProofOfLife(auth: Authenticated, evidence: unknown): Promise<{ livenessDueAt: string }> {
  const { embedding } = await verifyLivenessEvidence(`proof-of-life:${auth.session.id}`, evidence);
  const result = await matchIdentity(embedding, auth.identity.id);
  if (!result.matched) throw new AppError("FACE_NOT_MATCHED", 403);

  const now = new Date();
  const due = nextLivenessDue(now);
  await db.$transaction(async (tx) => {
    const before = await tx.identity.findUniqueOrThrow({ where: { id: auth.identity.id } });
    if (before.status !== "ACTIVE" && before.status !== "DORMANT") throw new AppError("IDENTITY_NOT_ACTIVE", 403);
    await tx.identity.update({ where: { id: before.id }, data: { status: "ACTIVE", lastLivenessAt: now, livenessDueAt: due } });
    await auditIn(tx, { type: "liveness.renewed", identityId: before.id, detail: { reactivated: before.status === "DORMANT" } });
  });
  return { livenessDueAt: due.toISOString() };
}
