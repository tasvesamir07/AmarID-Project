import { z } from "zod";
import { cancelEnrollment, getEnrollment, startEnrollment } from "@/server/enrollment";
import { AppError } from "@/server/errors";
import { api, clientIp, readJson } from "@/server/http";
import { isValidDob, normalizeDocNumber, normalizeMsisdn, normalizeName } from "@/lib/validation";

const body = z.object({
  docType: z.enum(["NID", "PASSPORT"]),
  docNumber: z.string().max(40),
  fullName: z.string().min(2).max(120),
  dob: z.string(),
  phone: z.string().max(24),
});

export const GET = api(async () => ({ enrollment: await getEnrollment() }));

export const POST = api(async (req) => {
  const input = await readJson(req, body);
  const docNumber = normalizeDocNumber(input.docType, input.docNumber);
  const msisdn = normalizeMsisdn(input.phone);
  const fullName = normalizeName(input.fullName);
  if (!docNumber) throw new AppError("DOCUMENT_NUMBER_INVALID", 400);
  if (!msisdn) throw new AppError("PHONE_INVALID", 400);
  if (!isValidDob(input.dob)) throw new AppError("DOB_INVALID", 400);
  if (fullName.length < 2) throw new AppError("NAME_INVALID", 400);
  return { enrollment: await startEnrollment({ docType: input.docType, docNumber, fullName, dob: input.dob, msisdn, ip: clientIp(req) }) };
});

export const DELETE = api(async () => {
  await cancelEnrollment();
});
