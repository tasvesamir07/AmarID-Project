import { enrollmentPasskeyOptions, issueIdentity } from "@/server/enrollment";
import { api, userAgent } from "@/server/http";

export const POST = api(async () => ({ options: await enrollmentPasskeyOptions() }));

export const PUT = api(async (req) => issueIdentity(await req.json(), userAgent(req)));
