import { z } from "zod";
import { confirmPhoneCode, resendPhoneCode } from "@/server/enrollment";
import { api, clientIp, readJson } from "@/server/http";

/** Confirm the one-time code. */
export const POST = api(async (req) => {
  const { code } = await readJson(req, z.object({ code: z.string().regex(/^\d{6}$/) }));
  return { enrollment: await confirmPhoneCode(code) };
});

/** Send a new code. */
export const PUT = api(async (req) => resendPhoneCode(clientIp(req)));
