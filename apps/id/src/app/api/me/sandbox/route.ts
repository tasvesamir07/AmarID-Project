import { z } from "zod";
import { api, readJson } from "@/server/http";
import { fastForward } from "@/server/sandbox";
import { requireSession } from "@/server/session";

/** Sandbox only: move this identity's proof-of-life clock forward. */
export const POST = api(async (req) => {
  const auth = await requireSession();
  const { days } = await readJson(req, z.object({ days: z.number().int().min(1).max(800) }));
  await fastForward(auth.identity.id, days);
});
