// Active liveness protocol shared by the camera component and the server.
//
// The server picks a random sequence of actions. The device must observe each
// one, in order, on a live face. Because the sequence is unpredictable, a
// printed photo or a pre-recorded video cannot satisfy it.

export const STEP_KINDS = ["TURN_LEFT", "TURN_RIGHT", "OPEN_MOUTH", "BLINK"] as const;
export type StepKind = (typeof STEP_KINDS)[number];

/** How strongly an action must register to count (see face-metrics.ts for the units). */
export const STEP_THRESHOLD: Record<StepKind, number> = {
  TURN_LEFT: 0.12,
  TURN_RIGHT: 0.12,
  OPEN_MOUTH: 0.3,
  BLINK: 0.45,
};

export const LIVENESS_LIMITS = {
  minDurationMs: 1500,
  maxDurationMs: 120_000,
  minFrames: 8,
  minSamples: 2,
  maxSamples: 5,
  /** Samples taken during one session must be the same face. */
  minSelfSimilarity: 0.45,
} as const;

export type LivenessChallenge = { challengeId: string; steps: StepKind[]; expiresAt: string };

export type LivenessEvidence = {
  challengeId: string;
  /** Face embeddings captured while the face was frontal. */
  samples: number[][];
  steps: { kind: StepKind; atMs: number; peak: number }[];
  durationMs: number;
  frames: number;
  /** Mean scores from the passive anti-spoofing models, 0..1, when available. */
  antispoof: number | null;
  liveness: number | null;
};
