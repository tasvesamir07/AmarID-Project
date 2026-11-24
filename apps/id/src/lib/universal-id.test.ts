import assert from "node:assert/strict";
import { randomInt } from "node:crypto";
import { describe, it } from "node:test";
import { maskUniversalId, normalizeUniversalId, universalIdFrom } from "./universal-id";
import { ageOn, isValidDob, normalizeDocNumber, normalizeMsisdn } from "./validation";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const random = () => universalIdFrom(Array.from({ length: 11 }, () => randomInt(32)));

describe("Universal ID", () => {
  it("round-trips and tolerates how people type", () => {
    for (let i = 0; i < 200; i++) {
      const id = random();
      assert.match(id, /^AID-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
      assert.equal(normalizeUniversalId(id), id);
      assert.equal(normalizeUniversalId(id.toLowerCase().replace(/-/g, " ")), id);
      assert.equal(normalizeUniversalId(id.slice(4).replace(/-/g, "")), id);
    }
  });

  it("catches every single-symbol typo", () => {
    for (let i = 0; i < 50; i++) {
      const id = random();
      const raw = id.replace(/^AID-|-/g, "");
      for (let pos = 0; pos < raw.length; pos++) {
        for (const ch of ALPHABET) {
          if (ch === raw[pos]) continue;
          const typo = raw.slice(0, pos) + ch + raw.slice(pos + 1);
          assert.equal(normalizeUniversalId(typo), null, `${id} → ${typo} should be rejected`);
        }
      }
    }
  });

  it("masks the middle group", () => {
    assert.equal(maskUniversalId("AID-7K4M-8391-92QX"), "AID-7K4M-••••-92QX");
  });
});

describe("input rules", () => {
  it("accepts Bangladeshi document numbers only in their real shapes", () => {
    assert.equal(normalizeDocNumber("NID", "123 456 7890"), "1234567890");
    assert.equal(normalizeDocNumber("NID", "1990123456789"), "1990123456789");
    assert.equal(normalizeDocNumber("NID", "19901234567890123"), "19901234567890123");
    assert.equal(normalizeDocNumber("NID", "12345"), null);
    assert.equal(normalizeDocNumber("PASSPORT", "a0123 4567"), "A01234567");
    assert.equal(normalizeDocNumber("PASSPORT", "bm 0123456"), "BM0123456");
    assert.equal(normalizeDocNumber("PASSPORT", "1234567"), null);
  });

  it("normalises mobile numbers to one canonical form", () => {
    for (const input of ["01712345678", "+880 1712-345678", "8801712345678"]) {
      assert.equal(normalizeMsisdn(input), "8801712345678");
    }
    assert.equal(normalizeMsisdn("01212345678"), null); // 012 is not a mobile prefix
    assert.equal(normalizeMsisdn("1712345678"), null);
  });

  it("validates dates of birth and computes age on the birthday boundary", () => {
    assert.equal(isValidDob("1990-02-30"), false);
    assert.equal(isValidDob("2999-01-01"), false);
    assert.equal(isValidDob("1990-02-28"), true);
    assert.equal(ageOn("2000-06-15", new Date("2018-06-14T12:00:00Z")), 17);
    assert.equal(ageOn("2000-06-15", new Date("2018-06-15T00:00:00Z")), 18);
  });
});
