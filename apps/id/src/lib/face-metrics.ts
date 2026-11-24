// Geometry on the 468-point face mesh (MediaPipe topology). Pure functions, so
// the liveness logic can be reasoned about and tested without a camera.
//
// Coordinates are pixels in the *unmirrored* camera frame: the person's left
// side appears on the right of the image.

import { STEP_THRESHOLD, type StepKind } from "./liveness";

export type Point = ArrayLike<number>;

const NOSE_TIP = 1;
const FACE_EDGE_A = 234;
const FACE_EDGE_B = 454;
const LIP_UPPER = 13;
const LIP_LOWER = 14;
const MOUTH_CORNER_A = 78;
const MOUTH_CORNER_B = 308;
// Eye landmarks in the order used by the eye-aspect-ratio formula.
const EYE_A = [33, 160, 158, 133, 153, 144] as const;
const EYE_B = [362, 385, 387, 263, 373, 380] as const;

const dist = (a: Point, b: Point) => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!);

export type FaceMetrics = {
  /** Head turn as nose offset / face width. Positive = toward the person's own left. */
  turn: number;
  /** Mouth opening: lip gap / mouth width. Closed ≈ 0, wide open ≈ 0.6. */
  mouth: number;
  /** Eye openness (eye aspect ratio, lower of the two eyes). Open ≈ 0.3, closed ≈ 0.1. */
  eye: number;
  /** Face width as a fraction of the frame width. */
  size: number;
  /** Face centre offset from the frame centre, as a fraction of the frame. */
  offsetX: number;
  offsetY: number;
};

function eyeAspectRatio(mesh: Point[], idx: readonly number[]): number {
  const [p1, p2, p3, p4, p5, p6] = idx.map((i) => mesh[i]!) as [Point, Point, Point, Point, Point, Point];
  return (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4) || 1);
}

export function measureFace(mesh: Point[], frameWidth: number, frameHeight: number): FaceMetrics | null {
  if (mesh.length < 468) return null;
  const a = mesh[FACE_EDGE_A]!;
  const b = mesh[FACE_EDGE_B]!;
  const nose = mesh[NOSE_TIP]!;
  const width = Math.abs(b[0]! - a[0]!);
  if (width < 1) return null;
  const midX = (a[0]! + b[0]!) / 2;
  const midY = (a[1]! + b[1]!) / 2;
  return {
    turn: (nose[0]! - midX) / width,
    mouth: dist(mesh[LIP_UPPER]!, mesh[LIP_LOWER]!) / (dist(mesh[MOUTH_CORNER_A]!, mesh[MOUTH_CORNER_B]!) || 1),
    eye: Math.min(eyeAspectRatio(mesh, EYE_A), eyeAspectRatio(mesh, EYE_B)),
    size: width / frameWidth,
    offsetX: midX / frameWidth - 0.5,
    offsetY: midY / frameHeight - 0.5,
  };
}

export type Framing = "OK" | "TOO_FAR" | "TOO_CLOSE" | "OFF_CENTRE" | "NOT_FRONTAL";

/** Is the face placed well enough to take a reference sample? */
export function framing(m: FaceMetrics): Framing {
  if (m.size < 0.24) return "TOO_FAR";
  if (m.size > 0.8) return "TOO_CLOSE";
  if (Math.abs(m.offsetX) > 0.17 || Math.abs(m.offsetY) > 0.2) return "OFF_CENTRE";
  if (Math.abs(m.turn) > 0.07 || m.mouth > 0.16) return "NOT_FRONTAL";
  return "OK";
}

/** How strongly the current frame shows the requested action (compare with STEP_THRESHOLD). */
export function stepStrength(kind: StepKind, m: FaceMetrics, openEyeBaseline: number): number {
  switch (kind) {
    case "TURN_LEFT":
      return m.turn;
    case "TURN_RIGHT":
      return -m.turn;
    case "OPEN_MOUTH":
      return m.mouth;
    case "BLINK":
      return openEyeBaseline > 0 ? 1 - m.eye / openEyeBaseline : 0;
  }
}

export type StepProgress = { hits: number; peak: number; closed: boolean; done: boolean };

export const newStepProgress = (): StepProgress => ({ hits: 0, peak: 0, closed: false, done: false });

/**
 * Feeds one frame into a step. Turns and mouth must hold for two consecutive
 * frames (a single noisy frame is not enough); a blink is eyes closing and
 * then opening again.
 */
export function advanceStep(kind: StepKind, progress: StepProgress, m: FaceMetrics, openEyeBaseline: number): StepProgress {
  const strength = stepStrength(kind, m, openEyeBaseline);
  const peak = Math.max(progress.peak, strength);
  if (kind === "BLINK") {
    // Ignore "blinks" while the head is turned: the far eye collapses in the mesh.
    if (Math.abs(m.turn) > 0.1) return { ...progress, peak: progress.peak };
    const closed = progress.closed || strength >= STEP_THRESHOLD.BLINK;
    return { hits: 0, peak, closed, done: closed && strength < 0.2 };
  }
  const hits = strength >= STEP_THRESHOLD[kind] ? progress.hits + 1 : 0;
  return { hits, peak, closed: false, done: hits >= 2 };
}
