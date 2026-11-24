import type { DocType } from "@/lib/validation";
import { auditIn } from "./audit";
import { blindIndex } from "./crypto/tokens";
import { db } from "./db";
import { enrollmentPhone } from "./enrollment";
import { env } from "./env";
import { AppError } from "./errors";
import { recoveryPhone } from "./recovery";

/**
 * Tools that exist only in sandbox mode. They let a demo show what normally
 * takes a year (proof of life falling due) or an external event (a death
 * recorded in the civil registry). Every use is written to the audit log.
 */

export function assertSandbox(): void {
  if (!env().sandbox) throw new AppError("NOT_FOUND", 404);
}

/** Messages "delivered" to the phone of the enrollment or recovery in this browser. */
export async function sandboxInbox(): Promise<{ to: string; messages: { id: string; body: string; at: string }[] } | null> {
  assertSandbox();
  const msisdn = (await enrollmentPhone()) ?? (await recoveryPhone());
  if (!msisdn) return null;
  const rows = await db.sandboxMessage.findMany({ where: { to: msisdn }, orderBy: { createdAt: "desc" }, take: 3 });
  return { to: msisdn, messages: rows.map((r) => ({ id: r.id, body: r.body, at: r.createdAt.toISOString() })) };
}

/** Moves the identity's proof-of-life clock forward, as if `days` had passed. */
export async function fastForward(identityId: string, days: number): Promise<void> {
  assertSandbox();
  const shift = days * 86_400_000;
  await db.$transaction(async (tx) => {
    const identity = await tx.identity.findUniqueOrThrow({ where: { id: identityId } });
    await tx.identity.update({
      where: { id: identityId },
      data: {
        lastLivenessAt: new Date(identity.lastLivenessAt.getTime() - shift),
        livenessDueAt: new Date(identity.livenessDueAt.getTime() - shift),
      },
    });
    await auditIn(tx, { type: "sandbox.action", identityId, detail: { action: "fast_forward", days } });
  });
}

/**
 * What a death notice from the civil registry does: the registry names a
 * document, we find the identity through the blind index — we never needed to
 * keep the number — close it, and end its sessions.
 */
export async function registryReportsDeath(docType: DocType, docNumber: string): Promise<{ matched: boolean }> {
  assertSandbox();
  await db.registryPerson.updateMany({ where: { docType, docNumber }, data: { deceased: true } });
  const identity = await db.identity.findUnique({ where: { docIndex: blindIndex("doc", `${docType}:${docNumber}`) } });
  if (!identity || identity.status === "DECEASED") return { matched: false };
  await db.$transaction(async (tx) => {
    await tx.identity.update({ where: { id: identity.id }, data: { status: "DECEASED" } });
    await tx.session.deleteMany({ where: { identityId: identity.id } });
    await auditIn(tx, { type: "identity.status_changed", identityId: identity.id, detail: { from: identity.status, to: "DECEASED", reason: "civil_registry_notice" } });
  });
  return { matched: true };
}
