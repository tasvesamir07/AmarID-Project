// Builds the search index the MCP server uses to answer questions about AmarID.
//
// Chunking follows the documents' own structure: one chunk per heading section,
// and each chunk carries its heading trail ("Security > Known limits") so a
// passage still makes sense when it is retrieved on its own. Long sections are
// split on paragraph boundaries, never mid-sentence.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");
const out = join(here, "..", "src", "generated", "docs-index.json");
const MAX_CHARS = 1400;

const sources = [
  { file: "README.md", title: "Overview" },
  { file: "docs/ARCHITECTURE.md", title: "Architecture" },
  { file: "docs/SECURITY.md", title: "Security and honesty notes" },
  { file: "docs/INTEGRATION.md", title: "Integration guide" },
];

function splitLong(text) {
  if (text.length <= MAX_CHARS) return [text];
  const parts = [];
  let current = "";
  for (const paragraph of text.split(/\n{2,}/)) {
    if (current && current.length + paragraph.length + 2 > MAX_CHARS) {
      parts.push(current);
      current = "";
    }
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  if (current) parts.push(current);
  return parts;
}

const chunks = [];
for (const source of sources) {
  const path = join(root, source.file);
  if (!existsSync(path)) continue;
  const lines = readFileSync(path, "utf8").replace(/\r\n/g, "\n").split("\n");
  const trail = [];
  let body = [];
  let inFence = false;
  const flush = () => {
    const text = body.join("\n").trim();
    body = [];
    if (text.length < 40) return;
    const heading = [source.title, ...trail.filter(Boolean)].join(" > ");
    splitLong(text).forEach((part, i) => {
      chunks.push({ id: `${source.file}#${chunks.length}`, source: source.file, heading, part: i, text: part });
    });
  };
  for (const line of lines) {
    if (line.startsWith("```")) inFence = !inFence;
    const match = inFence ? null : /^(#{1,4})\s+(.*)$/.exec(line);
    if (match) {
      flush();
      const depth = match[1].length;
      trail.length = depth - 1;
      // The top-level heading repeats the document title.
      trail[depth - 1] = depth === 1 ? "" : match[2].trim();
    } else {
      body.push(line);
    }
  }
  flush();
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ builtAt: new Date().toISOString(), chunks }));
console.log(`docs index: ${chunks.length} chunks from ${sources.length} documents`);
