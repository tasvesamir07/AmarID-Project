import type { NextRequest } from "next/server";
import { clientIp } from "@/server/http";
import { exchangeCode, OAuthError } from "@/server/oidc/provider";
import { rateLimit } from "@/server/ratelimit";

const headers = { "Cache-Control": "no-store", Pragma: "no-cache" };

/** OIDC token endpoint: server-to-server, authenticated by client credentials and PKCE. */
export async function POST(req: NextRequest) {
  try {
    await rateLimit(`token:ip:${clientIp(req)}`, 300, 600);
    if (!req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
      throw new OAuthError("invalid_request", "The body must be application/x-www-form-urlencoded.");
    }
    const form = new URLSearchParams(await req.text());
    return Response.json(await exchangeCode(req.headers, form), { headers });
  } catch (error) {
    if (error instanceof OAuthError) {
      const extra: Record<string, string> = error.status === 401 ? { "WWW-Authenticate": 'Basic realm="amarid"' } : {};
      return Response.json({ error: error.error, error_description: error.description }, { status: error.status, headers: { ...headers, ...extra } });
    }
    const limited = (error as { code?: string }).code === "RATE_LIMITED";
    if (!limited) console.error("[amarid] token endpoint failed:", error);
    return Response.json({ error: limited ? "slow_down" : "server_error" }, { status: limited ? 429 : 500, headers });
  }
}
