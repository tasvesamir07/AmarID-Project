import type { NextRequest } from "next/server";
import { clientIp, errorResponse, json } from "@/server/http";
import { checkPass } from "@/server/passes";
import { rateLimit } from "@/server/ratelimit";

// A public API for any verifier, anywhere: it takes no cookies, so it is safe
// to open to every origin.
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function POST(req: NextRequest) {
  try {
    await rateLimit(`pass-check:ip:${clientIp(req)}`, 120, 600);
    const body = (await req.json().catch(() => null)) as { token?: unknown } | null;
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token || token.length > 4000) return json({ valid: false, reason: "MALFORMED" }, 200, cors);
    return json(await checkPass(token), 200, cors);
  } catch (error) {
    return errorResponse(error);
  }
}
