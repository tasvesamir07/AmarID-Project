import type { DocType } from "@/lib/validation";
import { db } from "./db";
import { env } from "./env";

/**
 * Ports to systems AmarID does not own. Each has exactly one implementation
 * today — the sandbox — and the sandbox refuses to run when SANDBOX=false, so
 * a production deployment cannot silently "verify" people against fake data.
 *
 *   CivilRegistry  → Election Commission NID verification / e-Passport (DIP)
 *   SimRegistry    → BTRC central biometric SIM registration database
 *   SmsGateway     → an operator or aggregator SMS API
 */

export type DocumentClaim = { docType: DocType; docNumber: string; fullName: string; dob: string };

export type RegistryVerdict =
  | { ok: true }
  | { ok: false; reason: "DOCUMENT_NOT_FOUND" | "DOCUMENT_MISMATCH" | "HOLDER_DECEASED" };

export interface CivilRegistry {
  /** Does this document exist, and do name and date of birth match the record? */
  verify(claim: DocumentClaim): Promise<RegistryVerdict>;
  isDeceased(docType: DocType, docNumber: string): Promise<boolean>;
}

export interface SimRegistry {
  /** Is this SIM registered to the holder of this document? */
  ownerMatches(msisdn: string, docType: DocType, docNumber: string): Promise<{ ok: boolean; operator: string | null }>;
}

export interface SmsGateway {
  send(msisdn: string, text: string): Promise<void>;
}

const sameName = (a: string, b: string) =>
  a.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim() ===
  b.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/**
 * Sandbox registry. Works like a payment sandbox with test cards:
 *  - seeded records behave like real ones (wrong name → mismatch, deceased → refused);
 *  - a well-formed document number it has never seen is registered on first use
 *    with the name and date of birth supplied, so anyone can try the full flow.
 *    From then on that number belongs to that person.
 */
const sandboxCivilRegistry: CivilRegistry = {
  async verify(claim) {
    const where = { docType_docNumber: { docType: claim.docType, docNumber: claim.docNumber } };
    const record =
      (await db.registryPerson.findUnique({ where })) ??
      (await db.registryPerson.upsert({
        where,
        update: {},
        create: { docType: claim.docType, docNumber: claim.docNumber, fullName: claim.fullName, dob: claim.dob },
      }));
    if (record.deceased) return { ok: false, reason: "HOLDER_DECEASED" };
    if (!sameName(record.fullName, claim.fullName) || record.dob !== claim.dob) {
      return { ok: false, reason: "DOCUMENT_MISMATCH" };
    }
    return { ok: true };
  },
  async isDeceased(docType, docNumber) {
    const record = await db.registryPerson.findUnique({ where: { docType_docNumber: { docType, docNumber } } });
    return record?.deceased ?? false;
  },
};

const OPERATORS: Record<string, string> = { "13": "Grameenphone", "17": "Grameenphone", "14": "Banglalink", "19": "Banglalink", "15": "Teletalk", "16": "Robi", "18": "Robi" };

const sandboxSimRegistry: SimRegistry = {
  async ownerMatches(msisdn, docType, docNumber) {
    const person = await db.registryPerson.findUnique({ where: { docType_docNumber: { docType, docNumber } } });
    if (!person) return { ok: false, operator: null };
    const operator = OPERATORS[msisdn.slice(3, 5)] ?? "Unknown";
    const sim =
      (await db.registrySim.findUnique({ where: { msisdn } })) ??
      (await db.registrySim.upsert({ where: { msisdn }, update: {}, create: { msisdn, ownerId: person.id, operator } }));
    return { ok: sim.ownerId === person.id, operator: sim.operator };
  },
};

const sandboxSmsGateway: SmsGateway = {
  async send(msisdn, text) {
    await db.sandboxMessage.create({ data: { to: msisdn, body: text } });
  },
};

function requireSandbox(port: string): void {
  if (!env().sandbox) {
    throw new Error(`${port}: no production adapter is configured and SANDBOX=false. Refusing to simulate.`);
  }
}

export function civilRegistry(): CivilRegistry {
  requireSandbox("CivilRegistry");
  return sandboxCivilRegistry;
}

export function simRegistry(): SimRegistry {
  requireSandbox("SimRegistry");
  return sandboxSimRegistry;
}

export function smsGateway(): SmsGateway {
  requireSandbox("SmsGateway");
  return sandboxSmsGateway;
}
