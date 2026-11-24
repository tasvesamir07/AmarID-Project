import { z } from "zod";
import { normalizeUniversalId } from "@/lib/universal-id";
import { normalizeMsisdn } from "@/lib/validation";
import { AppError } from "@/server/errors";
import { api, clientIp, readJson } from "@/server/http";
import { confirmRecoveryCode, startRecovery } from "@/server/recovery";

/** Start: Universal ID + phone. Always answers the same way. */
export const POST = api(async (req) => {
  const input = await readJson(req, z.object({ universalId: z.string().max(40), phone: z.string().max(24) }));
  const universalId = normalizeUniversalId(input.universalId);
  const msisdn = normalizeMsisdn(input.phone);
  if (!universalId) throw new AppError("UNIVERSAL_ID_INVALID", 400);
  if (!msisdn) throw new AppError("PHONE_INVALID", 400);
  return startRecovery({ universalId, msisdn, ip: clientIp(req) });
});

/** Confirm the one-time code. */
export const PUT = api(async (req) => {
  const { code } = await readJson(req, z.object({ code: z.string().regex(/^\d{6}$/) }));
  await confirmRecoveryCode(code);
});
