import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

// One .env at the repository root serves both apps and every script.
if (!process.env.AMARID_MASTER_KEY) {
  config({ path: resolve(process.cwd(), "../../.env"), quiet: true });
}

const schema = z.object({
  APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  AMARID_MASTER_KEY: z.string().regex(/^[0-9a-f]{64}$/i, "must be 32 random bytes in hex"),
  SANDBOX: z.enum(["true", "false"]),
  ADMIN_TOKEN: z.string().min(12),
  PARTNERS_URL: z.url().default("http://localhost:3001"),
  FACE_MATCH_THRESHOLD: z.coerce.number().min(0.3).max(0.95).default(0.6),
  PROOF_OF_LIFE_DAYS: z.coerce.number().int().min(1).default(365),
  PROOF_OF_LIFE_GRACE_DAYS: z.coerce.number().int().min(0).default(30),
});

export type Env = {
  appUrl: string;
  origin: string;
  rpId: string;
  secureCookies: boolean;
  databaseUrl: string;
  masterKey: Buffer;
  sandbox: boolean;
  adminToken: string;
  partnersUrl: string;
  faceMatchThreshold: number;
  proofOfLifeDays: number;
  proofOfLifeGraceDays: number;
};

let cached: Env | undefined;

/**
 * Validated configuration. There are no insecure fallbacks: a missing or
 * malformed secret stops the process instead of silently using a default.
 */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid configuration — ${problems}`);
  }
  const e = parsed.data;
  const url = new URL(e.APP_URL);
  cached = {
    appUrl: url.origin,
    origin: url.origin,
    rpId: url.hostname,
    secureCookies: url.protocol === "https:",
    databaseUrl: e.DATABASE_URL,
    masterKey: Buffer.from(e.AMARID_MASTER_KEY, "hex"),
    sandbox: e.SANDBOX === "true",
    adminToken: e.ADMIN_TOKEN,
    partnersUrl: new URL(e.PARTNERS_URL).origin,
    faceMatchThreshold: e.FACE_MATCH_THRESHOLD,
    proofOfLifeDays: e.PROOF_OF_LIFE_DAYS,
    proofOfLifeGraceDays: e.PROOF_OF_LIFE_GRACE_DAYS,
  };
  return cached;
}
