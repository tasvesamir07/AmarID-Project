import { config } from "dotenv";
import { resolve } from "node:path";

// The demo partners read the same root .env as the identity provider, but they
// only ever use what a real third party would have: the issuer URL, their own
// client id and secret, and their own session key.
if (!process.env.PARTNERS_SESSION_SECRET) config({ path: resolve(process.cwd(), "../../.env"), quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export const env = {
  get issuer() {
    return new URL(process.env.APP_URL ?? "http://localhost:3000").origin;
  },
  get baseUrl() {
    return new URL(process.env.PARTNERS_URL ?? "http://localhost:3001").origin;
  },
  get sessionSecret() {
    return new TextEncoder().encode(required("PARTNERS_SESSION_SECRET"));
  },
};

export type Tenant = "bazar" | "bank";

export const tenants: Record<Tenant, { clientId: string; secret: () => string; scope: string }> = {
  // A shop asks for the minimum: a stable private id and "is this an adult".
  bazar: { clientId: "bazar-local", secret: () => required("BAZAR_CLIENT_SECRET"), scope: "openid age" },
  // A bank must know its customer, so it asks for the verified record.
  bank: { clientId: "probashi-bank", secret: () => required("BANK_CLIENT_SECRET"), scope: "openid profile birthdate phone kyc" },
};
