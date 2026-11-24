import { api, userAgent } from "@/server/http";
import { addPasskey, addPasskeyOptions } from "@/server/me";
import { requireSession } from "@/server/session";

export const POST = api(async () => ({ options: await addPasskeyOptions(await requireSession()) }));

export const PUT = api(async (req) => {
  await addPasskey(await requireSession(), await req.json(), userAgent(req));
});
