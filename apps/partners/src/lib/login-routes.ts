import { NextResponse, type NextRequest } from "next/server";
import { env, type Tenant } from "./env";
import { beginLogin, completeLogin } from "./oidc";
import { clearPending, getPending, setAccount, setPending } from "./session";

/** GET /<tenant>/login — send the visitor to AmarID. */
export function loginRoute(tenant: Tenant) {
  return async () => {
    try {
      const { url, pending } = await beginLogin(tenant);
      await setPending(tenant, { ...pending, startedAt: Date.now() });
      return NextResponse.redirect(url, 303);
    } catch (error) {
      console.error(`[${tenant}] could not start sign-in:`, error);
      return NextResponse.redirect(`${env.baseUrl}/${tenant}?error=unavailable`, 303);
    }
  };
}

/** GET /<tenant>/callback — AmarID sends the visitor back here. */
export function callbackRoute(tenant: Tenant) {
  return async (req: NextRequest) => {
    const pending = await getPending(tenant);
    await clearPending(tenant);
    const back = (query: string) => NextResponse.redirect(`${env.baseUrl}/${tenant}${query}`, 303);
    if (!pending) return back("?error=expired");
    if (req.nextUrl.searchParams.get("error") === "access_denied") return back("?error=declined");
    try {
      // Rebuild the URL on our public origin: behind a proxy req.url may differ.
      const callbackUrl = new URL(`${env.baseUrl}/${tenant}/callback${req.nextUrl.search}`);
      const claims = await completeLogin(tenant, callbackUrl, pending);
      await setAccount(tenant, { kind: "amarid", sub: String(claims.sub), claims, at: Date.now() });
      return back(`?welcome=${Math.max(1, Math.round((Date.now() - pending.startedAt) / 1000))}`);
    } catch (error) {
      console.error(`[${tenant}] sign-in failed:`, error);
      return back("?error=failed");
    }
  };
}
