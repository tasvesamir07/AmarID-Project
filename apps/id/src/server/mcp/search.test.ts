import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { corpusSize, searchDocs, tokenize } from "./search";

describe("documentation search", () => {
  it("drops stop words and matches simple word forms", () => {
    assert.deepEqual(tokenize("How are the passkeys verified?"), ["passkey", "verifi"]);
  });

  it("has an index built from the project documents", () => {
    assert.ok(corpusSize() > 10);
  });

  it("ranks the relevant section first", () => {
    const [top] = searchDocs("pairwise subject different private ID for every partner");
    assert.ok(top, "expected at least one hit");
    assert.match(`${top.heading} ${top.text}`, /pairwise/i);
  });

  it("finds what is simulated in the sandbox", () => {
    const hits = searchDocs("what is simulated in the sandbox SMS registry", 3);
    assert.ok(hits.length > 0 && hits.length <= 3);
    assert.ok(hits.some((h) => /simulated/i.test(h.text)));
  });

  it("returns nothing for a query with no usable words", () => {
    assert.deepEqual(searchDocs("the of and"), []);
    assert.deepEqual(searchDocs("zzzzqqqq"), []);
  });
});
