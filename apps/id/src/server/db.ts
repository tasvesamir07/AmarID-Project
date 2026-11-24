import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "./env";

const globalForDb = globalThis as unknown as { amaridDb?: PrismaClient };

function create(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: env().databaseUrl }) });
}

/** Single client per process; survives Next.js hot reloads in development. */
export const db: PrismaClient = globalForDb.amaridDb ?? (globalForDb.amaridDb = create());

export type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
