import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

process.env.AMARID_MASTER_KEY ??= "11".repeat(32);
process.env.DATABASE_URL ??= "postgresql://unused";
process.env.SANDBOX ??= "true";
process.env.ADMIN_TOKEN ??= "unit-test-admin-token";

// Loaded after the environment above is in place.
let applyTransform: typeof import("./template").applyTransform;
let openTemplate: typeof import("./template").openTemplate;
let protectTemplate: typeof import("./template").protectTemplate;
let rebindTemplate: typeof import("./template").rebindTemplate;
let similarity: typeof import("./template").similarity;
let open: typeof import("../crypto/seal").open;
let seal: typeof import("../crypto/seal").seal;
const EMBEDDING_SIZE = 1024;

before(async () => {
  ({ applyTransform, openTemplate, protectTemplate, rebindTemplate, similarity } = await import("./template"));
  ({ open, seal } = await import("../crypto/seal"));
});

const vector = () => Float32Array.from({ length: EMBEDDING_SIZE }, () => (Math.random() - 0.5) * 1.2);
const near = (v: Float32Array) => v.map((x) => x + (Math.random() - 0.5) * 0.04);
const distance = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.sqrt(Array.from(a, (x, i) => (x - b[i]!) ** 2).reduce((s, x) => s + x, 0));

describe("face template protection", () => {
  it("preserves distances exactly, so matching accuracy is unchanged", () => {
    for (let i = 0; i < 20; i++) {
      const a = vector();
      const b = i % 2 ? near(a) : vector();
      const before = distance(a, b);
      const after = distance(applyTransform(a), applyTransform(b));
      assert.ok(Math.abs(before - after) < 1e-3, `distance changed: ${before} → ${after}`);
    }
  });

  it("does not store anything resembling the original embedding", () => {
    const a = vector();
    const t = applyTransform(a);
    // The transformed vector is as far from the original as an unrelated vector is.
    assert.ok(distance(a, t) > 0.8 * distance(a, vector()));
    assert.ok(similarity(a, t) < 0.4);
  });

  it("matches the same face and separates different faces after protection", () => {
    const a = vector();
    const stored = openTemplate(protectTemplate(a, "owner-1"), "owner-1");
    assert.ok(similarity(applyTransform(near(a)), stored) > 0.9);
    assert.ok(similarity(applyTransform(vector()), stored) < 0.4);
  });

  it("binds a sealed template to its owner", () => {
    const sealed = protectTemplate(vector(), "owner-1");
    assert.throws(() => openTemplate(sealed, "owner-2"));
    const moved = rebindTemplate(sealed, "owner-1", "owner-2");
    assert.deepEqual(openTemplate(moved, "owner-2"), openTemplate(sealed, "owner-1"));
  });
});

describe("sealing", () => {
  it("round-trips, randomises, and rejects tampering or a wrong context", () => {
    const a = seal("Rahima Khatun", "identity:1:name");
    const b = seal("Rahima Khatun", "identity:1:name");
    assert.notDeepEqual(a, b);
    assert.equal(open(a, "identity:1:name").toString(), "Rahima Khatun");
    assert.throws(() => open(a, "identity:2:name"));
    const tampered = Uint8Array.from(a);
    tampered[tampered.length - 1]! ^= 1;
    assert.throws(() => open(tampered, "identity:1:name"));
  });
});
