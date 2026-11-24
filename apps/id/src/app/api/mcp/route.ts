import type { NextRequest } from "next/server";
import { clientIp, errorResponse } from "@/server/http";
import { handleMessage } from "@/server/mcp/server";
import { rateLimit } from "@/server/ratelimit";

export const dynamic = "force-dynamic";

// Model Context Protocol endpoint (Streamable HTTP, stateless). It is public
// and read-only, takes no cookies, and is rate limited per address.
const headers = { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" };
const MAX_BYTES = 16_000;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { ...headers, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id" },
  });
}

/** This server never pushes messages, so it offers no event stream. */
export function GET() {
  return new Response(null, { status: 405, headers: { ...headers, Allow: "POST, OPTIONS" } });
}

export async function POST(req: NextRequest) {
  try {
    await rateLimit(`mcp:ip:${clientIp(req)}`, 120, 60);
    const raw = await req.text();
    if (raw.length > MAX_BYTES) return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Request too large" } }, { status: 413, headers });
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400, headers });
    }
    if (Array.isArray(body)) {
      const replies = (await Promise.all(body.slice(0, 20).map(handleMessage))).filter((r) => r !== null);
      return replies.length ? Response.json(replies, { headers }) : new Response(null, { status: 202, headers });
    }
    const reply = await handleMessage(body);
    return reply ? Response.json(reply, { headers }) : new Response(null, { status: 202, headers });
  } catch (error) {
    return errorResponse(error);
  }
}
