import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/server/env";
import { AuthorizationDisplayError, AuthorizationRedirectError, beginAuthorization } from "@/server/oidc/provider";

/**
 * OIDC authorization endpoint. It validates the request, stores it, and hands
 * the browser to the sign-in / consent screen. The decision is never made here:
 * it always takes an explicit action by the signed-in person.
 */
export async function GET(req: NextRequest) {
  try {
    const { requestId } = await beginAuthorization(req.nextUrl.searchParams);
    return NextResponse.redirect(`${env().appUrl}/authorize/${requestId}`, { status: 303, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AuthorizationRedirectError) return NextResponse.redirect(error.toUrl(), { status: 303 });
    const reason = error instanceof AuthorizationDisplayError ? error.message : "The sign-in request could not be processed.";
    if (!(error instanceof AuthorizationDisplayError)) console.error("[amarid] authorize failed:", error);
    return NextResponse.redirect(`${env().appUrl}/authorize/error?reason=${encodeURIComponent(reason)}`, { status: 303 });
  }
}
