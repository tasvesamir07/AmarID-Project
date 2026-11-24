// Copies the on-device face engine (@vladmandic/human, MIT) and its models into
// public/, so the browser loads them from our own origin: nothing is fetched
// from a third-party CDN at runtime.
//
// The engine is served as a static ES module instead of going through the app
// bundler. It is a 2 MB browser-only library; keeping it out of the bundle
// means it is downloaded only by the pages that open the camera, and is never
// evaluated on the server.
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
// The package does not export its package.json, so locate it from the main entry (dist/…).
const pkg = dirname(dirname(require.resolve("@vladmandic/human")));
const src = join(pkg, "models");
const dest = join(here, "..", "public", "models");
const needed = ["blazeface", "facemesh", "iris", "faceres", "antispoof", "liveness"];

mkdirSync(dest, { recursive: true });
for (const name of needed) {
  for (const ext of ["json", "bin"]) {
    const file = `${name}.${ext}`;
    if (!existsSync(join(dest, file))) cpSync(join(src, file), join(dest, file));
  }
}

const vendor = join(here, "..", "public", "vendor");
mkdirSync(vendor, { recursive: true });
cpSync(join(pkg, "dist", "human.esm.js"), join(vendor, "human.esm.js"));
writeFileSync(
  join(vendor, "human-loader.js"),
  [
    'import { Human } from "./human.esm.js";',
    "window.__amaridHuman = Human;",
    'window.dispatchEvent(new Event("amarid-human-ready"));',
    "",
  ].join("\n"),
);
