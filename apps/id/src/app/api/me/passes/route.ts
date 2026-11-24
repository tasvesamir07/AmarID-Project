import { z } from "zod";
import { PASS_CLAIMS, PASS_DURATIONS } from "@/lib/pass-claims";
import { api, readJson } from "@/server/http";
import { createPass } from "@/server/passes";
import { rateLimit } from "@/server/ratelimit";
import { requireSession } from "@/server/session";

const body = z.object({
  label: z.string().trim().min(1).max(60),
  claims: z.array(z.enum(PASS_CLAIMS)).min(1),
  minutes: z.number().refine((m) => (PASS_DURATIONS as readonly number[]).includes(m)),
});

export const POST = api(async (req) => {
  const auth = await requireSession();
  await rateLimit(`pass:${auth.identity.id}`, 30, 3600);
  return createPass(auth.identity.id, await readJson(req, body));
});
