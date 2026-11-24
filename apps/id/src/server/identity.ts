import { randomInt } from "node:crypto";
import type { Identity } from "@/generated/prisma/client";
import { universalIdFrom } from "@/lib/universal-id";
import { ageOn } from "@/lib/validation";
import { auditIn } from "./audit";
import { openText } from "./crypto/seal";
import { db } from "./db";
import { env } from "./env";

const DAY = 86_400_000;

export const sealContext = {
  name: (identityId: string) => `identity:${identityId}:name`,
  dob: (identityId: string) => `identity:${identityId}:dob`,
  phone: (identityId: string) => `identity:${identityId}:phone`,
};

export function newUniversalId(): string {
  return universalIdFrom(Array.from({ length: 11 }, () => randomInt(32)));
}

export const nextLivenessDue = (from = new Date()) => new Date(from.getTime() + env().proofOfLifeDays * DAY);

export type LivenessState = "OK" | "DUE_SOON" | "OVERDUE" | "DORMANT";

/** Where the identity stands in its proof-of-life cycle. */
export function livenessState(identity: Pick<Identity, "status" | "livenessDueAt">, now = new Date()): LivenessState {
  if (identity.status === "DORMANT") return "DORMANT";
  const due = identity.livenessDueAt.getTime();
  if (now.getTime() > due) return "OVERDUE";
  if (now.getTime() > due - 30 * DAY) return "DUE_SOON";
  return "OK";
}

/**
 * Applies the one automatic status change: an ACTIVE identity whose proof of
 * life is overdue beyond the grace period becomes DORMANT. Evaluated whenever
 * the identity is used, so no background scheduler is needed for correctness.
 */
export async function refreshStatus(identity: Identity): Promise<Identity> {
  if (identity.status !== "ACTIVE") return identity;
  const cutoff = identity.livenessDueAt.getTime() + env().proofOfLifeGraceDays * DAY;
  if (Date.now() <= cutoff) return identity;
  return db.$transaction(async (tx) => {
    const updated = await tx.identity.update({ where: { id: identity.id }, data: { status: "DORMANT" } });
    await auditIn(tx, {
      type: "identity.status_changed",
      identityId: identity.id,
      detail: { from: "ACTIVE", to: "DORMANT", reason: "proof_of_life_overdue" },
    });
    return updated;
  });
}

export type Profile = {
  universalId: string;
  name: string;
  dob: string;
  age: number;
  docType: Identity["docType"];
  status: Identity["status"];
  issuedAt: Date;
  lastLivenessAt: Date;
  livenessDueAt: Date;
  livenessState: LivenessState;
};

/** Opens the sealed attributes. Call only for the identity's own session or a consented release. */
export function profileOf(identity: Identity): Profile {
  const dob = openText(identity.dobSealed, sealContext.dob(identity.id));
  return {
    universalId: identity.universalId,
    name: openText(identity.nameSealed, sealContext.name(identity.id)),
    dob,
    age: ageOn(dob),
    docType: identity.docType,
    status: identity.status,
    issuedAt: identity.issuedAt,
    lastLivenessAt: identity.lastLivenessAt,
    livenessDueAt: identity.livenessDueAt,
    livenessState: livenessState(identity),
  };
}
