import { z } from "zod";
import { normalizeDocNumber } from "@/lib/validation";
import { requireAdmin } from "@/server/admin";
import { AppError } from "@/server/errors";
import { api, readJson } from "@/server/http";
import { registryReportsDeath } from "@/server/sandbox";

/** Sandbox only: the civil registry reports that a document holder has died. */
export const POST = api(async (req) => {
  await requireAdmin();
  const input = await readJson(req, z.object({ docType: z.enum(["NID", "PASSPORT"]), docNumber: z.string().max(40) }));
  const docNumber = normalizeDocNumber(input.docType, input.docNumber);
  if (!docNumber) throw new AppError("DOCUMENT_NUMBER_INVALID", 400);
  return registryReportsDeath(input.docType, docNumber);
});
