import { z } from "zod";
import { normalizeDocNumber } from "@/lib/validation";
import { addDocument, verifiedDocuments } from "@/server/documents";
import { AppError } from "@/server/errors";
import { api, readJson } from "@/server/http";
import { rateLimit } from "@/server/ratelimit";
import { requireSession } from "@/server/session";

const body = z.object({ docType: z.enum(["NID", "PASSPORT"]), docNumber: z.string().trim().min(1).max(40) });

export const GET = api(async () => {
  const auth = await requireSession();
  return { documents: await verifiedDocuments(auth.identity) };
});

/** Verify one more document (an NID or a passport) for the signed-in person. */
export const POST = api(async (req) => {
  const auth = await requireSession();
  await rateLimit(`document:${auth.identity.id}`, 8, 3600);
  const input = await readJson(req, body);
  const docNumber = normalizeDocNumber(input.docType, input.docNumber);
  if (!docNumber) throw new AppError("DOCUMENT_NUMBER_INVALID", 400);
  return { document: await addDocument(auth.identity, { docType: input.docType, docNumber }) };
});
