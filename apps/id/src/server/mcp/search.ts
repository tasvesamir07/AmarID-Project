import index from "@/generated/docs-index.json";

/**
 * Keyword retrieval over the project documentation, ranked with BM25.
 *
 * The corpus is a few dozen passages, so an exact in-memory ranking is both
 * the simplest and the most accurate option: no embedding model, no external
 * service, and results are reproducible.
 */

type Chunk = { id: string; source: string; heading: string; part: number; text: string };

const chunks = (index as { chunks: Chunk[] }).chunks;

const STOP = new Set("a an and are as at be by for from has have how in is it of on or that the this to was what when where which who why with you your".split(" "));

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => t.length > 1 && !STOP.has(t)).map(stem);
}

/** A very small stemmer: enough to match "passkeys" with "passkey" and "verified" with "verify". */
function stem(token: string): string {
  if (token.length > 5 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

const K1 = 1.4;
const B = 0.75;
// The heading trail is short and descriptive, so a match there counts double.
const HEADING_WEIGHT = 2;

const docs = chunks.map((chunk) => {
  const tf = new Map<string, number>();
  for (const t of tokenize(chunk.text)) tf.set(t, (tf.get(t) ?? 0) + 1);
  for (const t of tokenize(chunk.heading)) tf.set(t, (tf.get(t) ?? 0) + HEADING_WEIGHT);
  let length = 0;
  for (const n of tf.values()) length += n;
  return { chunk, tf, length };
});
const averageLength = docs.reduce((sum, d) => sum + d.length, 0) / Math.max(1, docs.length);
const documentFrequency = new Map<string, number>();
for (const d of docs) for (const t of d.tf.keys()) documentFrequency.set(t, (documentFrequency.get(t) ?? 0) + 1);

export type SearchHit = { source: string; heading: string; score: number; text: string };

export function searchDocs(query: string, limit = 4): SearchHit[] {
  const terms = [...new Set(tokenize(query))];
  if (terms.length === 0) return [];
  const scored = docs
    .map((d) => {
      let score = 0;
      for (const term of terms) {
        const f = d.tf.get(term);
        if (!f) continue;
        const n = documentFrequency.get(term) ?? 0;
        const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
        score += (idf * f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.length) / averageLength));
      }
      return { d, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(Math.max(limit, 1), 8));
  return scored.map(({ d, score }) => ({ source: d.chunk.source, heading: d.chunk.heading, score: Math.round(score * 100) / 100, text: d.chunk.text }));
}

export const corpusSize = () => docs.length;
