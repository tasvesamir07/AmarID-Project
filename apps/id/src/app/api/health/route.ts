import { db } from "@/server/db";

export const dynamic = "force-dynamic";

/** Liveness and readiness in one: the app is useful only if it can reach its database. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "database_unreachable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
