import { jwks } from "@/server/oidc/keys";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await jwks(), { headers: { "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" } });
}
