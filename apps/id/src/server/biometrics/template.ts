import { createCipheriv } from "node:crypto";
import { deriveKey } from "../crypto/keys";
import { open, seal, type Bytes } from "../crypto/seal";
import { AppError } from "../errors";

/**
 * Face template protection.
 *
 * A face embedding is a fuzzy measurement: two captures of the same person are
 * close, never equal. It therefore cannot be hashed like a password — a hash
 * would never match again. What we do instead:
 *
 *  1. Cancelable transform. The embedding is passed through a secret orthogonal
 *     transform derived from the master key (sign flips, permutations and two
 *     Walsh–Hadamard mixes). Orthogonal means distances are preserved exactly,
 *     so matching accuracy is unchanged, but the stored vector no longer lives
 *     in the face model's embedding space: without the key it cannot be fed to
 *     a model-inversion attack or compared with templates from another system.
 *     If templates ever leak, rotating the key revokes all of them at once
 *     (the "renewability" and "unlinkability" properties of ISO/IEC 24745).
 *  2. Sealing. The transformed vector is encrypted with AES-256-GCM, bound to
 *     the owning record.
 *
 * The camera image itself never reaches the server: the embedding is computed
 * on the citizen's device.
 */

export const EMBEDDING_SIZE = 1024;
export const TRANSFORM_VERSION = 1;

type Transform = { signs1: Int8Array; signs2: Int8Array; perm1: Uint16Array; perm2: Uint16Array };

let transform: Transform | undefined;

function keystream(bytes: number): Buffer {
  const key = deriveKey(`template-transform/v${TRANSFORM_VERSION}`);
  const cipher = createCipheriv("aes-256-ctr", key, Buffer.alloc(16));
  return cipher.update(Buffer.alloc(bytes));
}

function buildTransform(): Transform {
  const n = EMBEDDING_SIZE;
  const stream = keystream(n * 2 + n * 8);
  let offset = 0;
  const signs = () => {
    const out = new Int8Array(n);
    for (let i = 0; i < n; i++) out[i] = stream[offset++]! & 1 ? 1 : -1;
    return out;
  };
  const permutation = () => {
    const out = new Uint16Array(n);
    for (let i = 0; i < n; i++) out[i] = i;
    // Fisher–Yates with 32-bit draws; modulo bias is ~2^-22 for n=1024.
    for (let i = n - 1; i > 0; i--) {
      const j = stream.readUInt32BE(offset) % (i + 1);
      offset += 4;
      const tmp = out[i]!;
      out[i] = out[j]!;
      out[j] = tmp;
    }
    return out;
  };
  return { signs1: signs(), signs2: signs(), perm1: permutation(), perm2: permutation() };
}

/** In-place orthonormal fast Walsh–Hadamard transform (length must be a power of two). */
function hadamard(v: Float64Array): void {
  const n = v.length;
  for (let len = 1; len < n; len <<= 1) {
    for (let i = 0; i < n; i += len << 1) {
      for (let j = i; j < i + len; j++) {
        const a = v[j]!;
        const b = v[j + len]!;
        v[j] = a + b;
        v[j + len] = a - b;
      }
    }
  }
  const scale = 1 / Math.sqrt(n);
  for (let i = 0; i < n; i++) v[i] = v[i]! * scale;
}

export function applyTransform(embedding: ArrayLike<number>): Float32Array {
  const t = (transform ??= buildTransform());
  const n = EMBEDDING_SIZE;
  let v = new Float64Array(n);
  for (let i = 0; i < n; i++) v[i] = embedding[i]! * t.signs1[i]!;
  hadamard(v);
  let w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = v[t.perm1[i]!]! * t.signs2[i]!;
  hadamard(w);
  v = new Float64Array(n);
  for (let i = 0; i < n; i++) v[i] = w[t.perm2[i]!]!;
  return Float32Array.from(v);
}

/** Checks the shape of an embedding sent by a device and returns it as a typed array. */
export function parseEmbedding(input: unknown): Float32Array {
  if (!Array.isArray(input) || input.length !== EMBEDDING_SIZE) {
    throw new AppError("FACE_TEMPLATE_INVALID", 400);
  }
  const out = new Float32Array(EMBEDDING_SIZE);
  let energy = 0;
  for (let i = 0; i < EMBEDDING_SIZE; i++) {
    const x = input[i];
    if (typeof x !== "number" || !Number.isFinite(x) || Math.abs(x) > 1000) {
      throw new AppError("FACE_TEMPLATE_INVALID", 400);
    }
    out[i] = x;
    energy += x * x;
  }
  // An all-zero or near-constant vector is not the output of the face model.
  if (energy < 1e-3) throw new AppError("FACE_TEMPLATE_INVALID", 400);
  return out;
}

export function meanEmbedding(samples: Float32Array[]): Float32Array {
  const out = new Float32Array(EMBEDDING_SIZE);
  for (const s of samples) for (let i = 0; i < EMBEDDING_SIZE; i++) out[i]! += s[i]! / samples.length;
  return out;
}

/**
 * Similarity in 0..1. Same scale as the on-device model's reference matcher
 * (Euclidean distance mapped to a score; about 0.5 and above means the same
 * person). Works identically on raw and on transformed templates because the
 * transform is orthogonal.
 */
export function similarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < EMBEDDING_SIZE; i++) {
    const d = a[i]! - b[i]!;
    sum += d * d;
  }
  const score = (1 - Math.sqrt(25 * sum) / 100 - 0.2) / 0.6;
  return Math.max(0, Math.min(1, score));
}

const context = (ownerId: string) => `face-template:${ownerId}`;

/** embedding → transformed → sealed bytes, ready to store. */
export function protectTemplate(embedding: Float32Array, ownerId: string): Bytes {
  const transformed = applyTransform(embedding);
  return seal(Buffer.from(transformed.buffer, transformed.byteOffset, transformed.byteLength), context(ownerId));
}

/** sealed bytes → transformed template (never the original embedding). */
export function openTemplate(sealed: Uint8Array, ownerId: string): Float32Array {
  const bytes = open(sealed, context(ownerId));
  const copy = new Uint8Array(bytes); // fresh, aligned buffer
  return new Float32Array(copy.buffer, 0, EMBEDDING_SIZE);
}

/** Moves a sealed template from one owner (an enrollment) to another (the identity). */
export function rebindTemplate(sealed: Uint8Array, fromOwner: string, toOwner: string): Bytes {
  return seal(open(sealed, context(fromOwner)), context(toOwner));
}
