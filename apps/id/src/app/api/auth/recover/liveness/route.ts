import { api, userAgent } from "@/server/http";
import { completeRecovery, recoveryLivenessChallenge } from "@/server/recovery";

export const POST = api(async () => recoveryLivenessChallenge());

export const PUT = api(async (req) => {
  await completeRecovery(await req.json().catch(() => null), userAgent(req));
});
