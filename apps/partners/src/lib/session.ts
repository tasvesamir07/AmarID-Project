import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { env, type Tenant } from "./env";
import type { Pending } from "./oidc";

// Each demo site keeps its own signed session cookie, exactly as two unrelated
// companies would. They share nothing about the visitor.

const secure = () => env.baseUrl.startsWith("https:");

async function write(name: string, payload: Record<string, unknown>, maxAge: number) {
  const token = await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${maxAge}s`).sign(env.sessionSecret);
  (await cookies()).set(name, token, { httpOnly: true, sameSite: "lax", secure: secure(), path: "/", maxAge });
}

async function read<T>(name: string): Promise<T | null> {
  const token = (await cookies()).get(name)?.value;
  if (!token) return null;
  try {
    return (await jwtVerify(token, env.sessionSecret, { algorithms: ["HS256"] })).payload as T;
  } catch {
    return null;
  }
}

export type Account = { kind: "amarid"; sub: string; claims: Record<string, unknown>; at: number } | { kind: "phone"; phone: string; at: number };

export const setAccount = (tenant: Tenant, account: Account) => write(`${tenant}_session`, account, 3600);
export const getAccount = (tenant: Tenant) => read<Account>(`${tenant}_session`);
export const clearAccount = async (tenant: Tenant) => void (await cookies()).delete(`${tenant}_session`);

export const setPending = (tenant: Tenant, pending: Pending & { startedAt: number }) => write(`${tenant}_login`, pending, 600);
export const getPending = (tenant: Tenant) => read<Pending & { startedAt: number }>(`${tenant}_login`);
export const clearPending = async (tenant: Tenant) => void (await cookies()).delete(`${tenant}_login`);
