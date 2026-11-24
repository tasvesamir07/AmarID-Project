import type { Identity } from "@/generated/prisma/client";
import type { DocType } from "@/lib/validation";
import { civilRegistry } from "./adapters";
import { auditIn } from "./audit";
import { blindIndex } from "./crypto/tokens";
import { db } from "./db";
import { AppError } from "./errors";
import { profileOf } from "./identity";

/**
 * The documents a person has verified with AmarID.
 *
 * A partner can require one ("this wallet needs an NID", "this service abroad
 * needs a passport"). What the partner then receives is only the fact that the
 * person holds a verified document of that type. The number is checked against
 * the registry here and never stored or released: AmarID keeps a keyed blind
 * index of it, enough to stop one document being attached to two people.
 */

export type VerifiedDocument = { docType: DocType; verifiedAt: Date; atEnrollment: boolean };

export async function verifiedDocuments(identity: Identity): Promise<VerifiedDocument[]> {
  const added = await db.identityDocument.findMany({ where: { identityId: identity.id }, orderBy: { verifiedAt: "asc" } });
  return [
    { docType: identity.docType as DocType, verifiedAt: identity.issuedAt, atEnrollment: true },
    ...added.map((d) => ({ docType: d.docType as DocType, verifiedAt: d.verifiedAt, atEnrollment: false })),
  ];
}

export async function holdsDocument(identity: Identity, docType: DocType): Promise<boolean> {
  if (identity.docType === docType) return true;
  return (await db.identityDocument.count({ where: { identityId: identity.id, docType } })) > 0;
}

/**
 * Verifies a second document for an existing identity.
 *
 * The registry must hold the document under the same name and date of birth
 * as the identity: that is what ties the new document to this person rather
 * than to whoever is typing. The caller must already be signed in with their
 * passkey.
 */
export async function addDocument(identity: Identity, input: { docType: DocType; docNumber: string }): Promise<VerifiedDocument> {
  if (identity.status !== "ACTIVE") throw new AppError("IDENTITY_NOT_ACTIVE", 403);
  if (await holdsDocument(identity, input.docType)) throw new AppError("DOCUMENT_ALREADY_ADDED", 409);

  const profile = profileOf(identity);
  const verdict = await civilRegistry().verify({ docType: input.docType, docNumber: input.docNumber, fullName: profile.name, dob: profile.dob });
  if (!verdict.ok) throw new AppError(verdict.reason, 422);

  const docIndex = blindIndex("doc", `${input.docType}:${input.docNumber}`);
  const takenAtEnrollment = await db.identity.count({ where: { docIndex } });
  if (takenAtEnrollment > 0) throw new AppError("DOCUMENT_IN_USE", 409);

  try {
    const row = await db.$transaction(async (tx) => {
      const created = await tx.identityDocument.create({ data: { identityId: identity.id, docType: input.docType, docIndex } });
      await auditIn(tx, { type: "document.added", identityId: identity.id, detail: { docType: input.docType } });
      return created;
    });
    return { docType: row.docType as DocType, verifiedAt: row.verifiedAt, atEnrollment: false };
  } catch (error) {
    // The unique indexes are the real guard against two requests racing.
    if ((error as { code?: string }).code === "P2002") throw new AppError("DOCUMENT_IN_USE", 409);
    throw error;
  }
}
