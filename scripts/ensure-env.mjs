// Creates .env from .env.example on first run, filling every empty secret with
// fresh random bytes. Existing values are never overwritten.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");

const generators = {
  AMARID_MASTER_KEY: () => randomBytes(32).toString("hex"),
  ADMIN_TOKEN: () => randomBytes(12).toString("base64url"),
  BAZAR_CLIENT_SECRET: () => randomBytes(24).toString("base64url"),
  BANK_CLIENT_SECRET: () => randomBytes(24).toString("base64url"),
  PARTNERS_SESSION_SECRET: () => randomBytes(32).toString("hex"),
};

export function ensureEnv() {
  const source = existsSync(envPath) ? envPath : join(root, ".env.example");
  let changed = !existsSync(envPath);
  const lines = readFileSync(source, "utf8")
    .split(/\r?\n/)
    .map((line) => {
      const match = /^([A-Z_]+)=\s*$/.exec(line);
      if (match && generators[match[1]]) {
        changed = true;
        return `${match[1]}=${generators[match[1]]()}`;
      }
      return line;
    });
  if (changed) {
    writeFileSync(envPath, lines.join("\n"));
    console.log("Wrote .env with generated secrets");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) ensureEnv();
