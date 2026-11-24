import { createHash } from "node:crypto";
import { db, type Tx } from "./db";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Tamper-evident activity log.
 *
 * Every event stores the hash of the previous one, so removing or editing any
 * row breaks every hash after it. Appends are serialised with a transaction
 * level advisory lock, which keeps the chain linear under concurrency.
 *
 * `detail` must never contain personal data — only ids, scopes and outcomes.
 */

export type AuditType =
  | "enrollment.started"
  | "enrollment.rejected"
  | "enrollment.duplicate_blocked"
  | "identity.issued"
  | "identity.status_changed"
  | "auth.signed_in"
  | "auth.signed_out"
  | "auth.recovered"
  | "document.added"
  | "passkey.added"
  | "passkey.revoked"
  | "consent.granted"
  | "consent.revoked"
  | "partner.signed_in"
  | "partner.claims_read"
  | "pass.created"
  | "pass.checked"
  | "pass.revoked"
  | "liveness.renewed"
  | "partner.registered"
  | "sandbox.action";

type Detail = Record<string, string | number | boolean | null | string[]>;

export type AuditInput = { type: AuditType; identityId?: string | null; clientId?: string | null; detail?: Detail };

const GENESIS = "amarid-audit-genesis";
const LOCK_KEY = 4_100_771; // arbitrary, unique to this log

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`).join(",")}}`;
}

export function eventHash(prevHash: string, e: { type: string; identityId: string | null; clientId: string | null; detail: unknown; createdAt: Date }): string {
  const body = canonical({ type: e.type, identityId: e.identityId, clientId: e.clientId, detail: e.detail, createdAt: e.createdAt.toISOString() });
  return createHash("sha256").update(prevHash).update("\n").update(body).digest("hex");
}

async function append(tx: Tx, input: AuditInput): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_KEY})`;
  const last = await tx.auditEvent.findFirst({ orderBy: { seq: "desc" }, select: { hash: true } });
  const prevHash = last?.hash ?? GENESIS;
  // Millisecond precision, so the stored value hashes to the same string later.
  const createdAt = new Date(Math.floor(Date.now()));
  const row = {
    type: input.type,
    identityId: input.identityId ?? null,
    clientId: input.clientId ?? null,
    detail: (input.detail ?? {}) as Prisma.InputJsonValue,
    createdAt,
  };
  await tx.auditEvent.create({ data: { ...row, prevHash, hash: eventHash(prevHash, row) } });
}

/** Append inside an existing transaction (the event commits or rolls back with the change it describes). */
export const auditIn = append;

/** Append in its own transaction. */
export async function audit(input: AuditInput): Promise<void> {
  await db.$transaction((tx) => append(tx, input));
}

export async function verifyAuditChain(): Promise<{ ok: boolean; events: number; brokenAtSeq: string | null }> {
  let prevHash = GENESIS;
  let events = 0;
  let cursor: bigint | undefined;
  for (;;) {
    const page = await db.auditEvent.findMany({
      take: 1000,
      ...(cursor !== undefined ? { where: { seq: { gt: cursor } } } : {}),
      orderBy: { seq: "asc" },
    });
    if (page.length === 0) break;
    for (const row of page) {
      if (row.prevHash !== prevHash || row.hash !== eventHash(prevHash, row)) {
        return { ok: false, events, brokenAtSeq: row.seq.toString() };
      }
      prevHash = row.hash;
      events += 1;
    }
    cursor = page[page.length - 1]!.seq;
  }
  return { ok: true, events, brokenAtSeq: null };
}
