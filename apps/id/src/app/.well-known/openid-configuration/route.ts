import { discoveryDocument } from "@/server/oidc/provider";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(discoveryDocument(), { headers: { "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" } });
}
