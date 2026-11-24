import { z } from "zod";
import { api, clientIp, readJson, userAgent } from "@/server/http";
import { rateLimit } from "@/server/ratelimit";
import { createSession } from "@/server/session";
import { authenticationOptions, verifyAuthentication } from "@/server/webauthn";

export const POST = api(async (req) => {
  await rateLimit(`signin:ip:${clientIp(req)}`, 60, 600);
  return authenticationOptions();
});

export const PUT = api(async (req) => {
  const { attemptId, response } = await readJson(req, z.object({ attemptId: z.uuid(), response: z.any() }));
  const { identityId } = await verifyAuthentication(attemptId, response);
  await createSession({ identityId, amr: ["hwk", "user"], userAgent: userAgent(req) });
});
