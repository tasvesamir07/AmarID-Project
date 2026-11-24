import { randomInt } from "node:crypto";
import { z } from "zod";
import {
  LIVENESS_LIMITS,
  STEP_KINDS,
  STEP_THRESHOLD,
  type LivenessChallenge,
  type StepKind,
} from "@/lib/liveness";
import { db } from "../db";
import { AppError } from "../errors";
import { meanEmbedding, parseEmbedding, similarity } from "./template";

/**
 * Trust boundary, stated plainly: in this build the face is analysed on the
 * citizen's device and the device reports the result. The server issues the
 * unpredictable challenge, binds it to one enrollment or session, enforces
 * single use and timing, and checks that the evidence is internally
 * consistent — but it cannot prove the report came from an untampered camera.
 *
 * Closing that gap is a deployment decision, not a code change here: either a
 * certified presentation-attack-detection SDK (ISO/IEC 30107-3) with device
 * attestation in the native app, or supervised capture at an enrollment point.
 * Both plug in behind `verifyLivenessEvidence`.
 */

const CHALLENGE_TTL_MS = 3 * 60_000;

export const evidenceSchema = z.object({
  challengeId: z.uuid(),
  samples: z.array(z.array(z.number())).min(LIVENESS_LIMITS.minSamples).max(LIVENESS_LIMITS.maxSamples),
  steps: z.array(z.object({ kind: z.enum(STEP_KINDS), atMs: z.number().nonnegative(), peak: z.number() })).max(8),
  durationMs: z.number().nonnegative(),
  frames: z.number().int().nonnegative(),
  antispoof: z.number().min(0).max(1).nullable(),
  liveness: z.number().min(0).max(1).nullable(),
});

function pickSteps(): StepKind[] {
  // Always one head turn (the strongest signal against a flat photo), then two
  // more distinct actions, in random order.
  const turn: StepKind = randomInt(2) === 0 ? "TURN_LEFT" : "TURN_RIGHT";
  const rest = STEP_KINDS.filter((k) => k !== turn);
  const chosen: StepKind[] = [turn];
  while (chosen.length < 3) {
    const next = rest.splice(randomInt(rest.length), 1)[0]!;
    chosen.push(next);
  }
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chosen[i], chosen[j]] = [chosen[j]!, chosen[i]!];
  }
  return chosen;
}

/** `subject` binds the challenge to exactly one enrollment, session or recovery attempt. */
export async function issueLivenessChallenge(subject: string): Promise<LivenessChallenge> {
  const steps = pickSteps();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  const challenge = await db.challenge.create({
    data: { kind: "LIVENESS", subject, data: { steps }, expiresAt },
  });
  return { challengeId: challenge.id, steps, expiresAt: expiresAt.toISOString() };
}

export type LivenessResult = { embedding: Float32Array; signals: { antispoof: number | null; liveness: number | null } };

/** Consumes the challenge (single use) and returns the averaged face embedding. */
export async function verifyLivenessEvidence(subject: string, input: unknown): Promise<LivenessResult> {
  const parsed = evidenceSchema.safeParse(input);
  if (!parsed.success) throw new AppError("LIVENESS_EVIDENCE_INVALID", 400);
  const evidence = parsed.data;

  // Atomically claim the challenge so the same evidence cannot be replayed.
  const claimed = await db.challenge.updateMany({
    where: { id: evidence.challengeId, kind: "LIVENESS", subject, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() },
  });
  if (claimed.count !== 1) throw new AppError("LIVENESS_CHALLENGE_EXPIRED", 400);
  const challenge = await db.challenge.findUniqueOrThrow({ where: { id: evidence.challengeId } });
  const issued = (challenge.data as { steps: StepKind[] }).steps;

  const elapsed = Date.now() - challenge.createdAt.getTime();
  const tooFast = elapsed < LIVENESS_LIMITS.minDurationMs || evidence.durationMs < LIVENESS_LIMITS.minDurationMs;
  if (tooFast || evidence.durationMs > LIVENESS_LIMITS.maxDurationMs || evidence.frames < LIVENESS_LIMITS.minFrames) {
    throw new AppError("LIVENESS_FAILED", 400);
  }

  if (evidence.steps.length !== issued.length) throw new AppError("LIVENESS_FAILED", 400);
  let last = -1;
  evidence.steps.forEach((step, i) => {
    const ok = step.kind === issued[i] && step.atMs > last && step.atMs <= evidence.durationMs && step.peak >= STEP_THRESHOLD[step.kind];
    if (!ok) throw new AppError("LIVENESS_FAILED", 400);
    last = step.atMs;
  });

  // The passive models are small and noisy; they only veto clear spoofs.
  if ((evidence.antispoof !== null && evidence.antispoof < 0.25) || (evidence.liveness !== null && evidence.liveness < 0.25)) {
    throw new AppError("LIVENESS_FAILED", 400);
  }

  const samples = evidence.samples.map(parseEmbedding);
  for (let i = 0; i < samples.length; i++) {
    for (let j = i + 1; j < samples.length; j++) {
      if (similarity(samples[i]!, samples[j]!) < LIVENESS_LIMITS.minSelfSimilarity) {
        throw new AppError("LIVENESS_FACE_CHANGED", 400);
      }
    }
  }

  return {
    embedding: meanEmbedding(samples),
    signals: { antispoof: evidence.antispoof, liveness: evidence.liveness },
  };
}
