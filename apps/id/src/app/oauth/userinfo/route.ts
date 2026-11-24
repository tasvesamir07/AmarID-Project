import type { NextRequest } from "next/server";
import { OAuthError, userInfo } from "@/server/oidc/provider";

async function handle(req: NextRequest) {
  try {
    return Response.json(await userInfo(req.headers.get("authorization")), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof OAuthError) {
      return Response.json({ error: error.error, error_description: error.description }, {
        status: error.status,
        headers: { "Cache-Control": "no-store", "WWW-Authenticate": `Bearer error="${error.error}"` },
      });
    }
    console.error("[amarid] userinfo failed:", error);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
