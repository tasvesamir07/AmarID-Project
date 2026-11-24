import { z } from "zod";
import { adminSignIn, adminSignOut } from "@/server/admin";
import { api, clientIp, readJson } from "@/server/http";

export const POST = api(async (req) => {
  const { token } = await readJson(req, z.object({ token: z.string().min(1).max(200) }));
  await adminSignIn(token, clientIp(req));
});

export const DELETE = api(async () => {
  await adminSignOut();
});
