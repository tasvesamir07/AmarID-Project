import { z } from "zod";
import { registerClient, requireAdmin } from "@/server/admin";
import { api, readJson } from "@/server/http";

const body = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(200).default(""),
  category: z.string().trim().min(2).max(40).default("Service"),
  redirectUris: z.array(z.string().max(300)).min(1).max(5),
  scopes: z.string().max(100).default(""),
  confidential: z.boolean().default(true),
});

export const POST = api(async (req) => {
  await requireAdmin();
  return registerClient(await readJson(req, body));
});
