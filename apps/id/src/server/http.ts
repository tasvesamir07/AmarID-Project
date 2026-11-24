import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { env } from "./env";
import { AppError } from "./errors";

type Result = Response | Record<string, unknown> | void;

/**
 * Wraps a route handler for the browser-facing JSON API:
 *  - rejects state-changing requests that do not come from our own origin
 *    (CSRF defence in addition to SameSite cookies);
 *  - turns AppError into `{ error: { code } }` and hides everything else;
 *  - marks every response as uncacheable.
 */
export function api<C>(handler: (req: NextRequest, ctx: C) => Promise<Result>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      assertSameOrigin(req);
      const out = await handler(req, ctx);
      if (out instanceof Response) return out;
      return json(out ?? { ok: true });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    const headers: Record<string, string> = {};
    const retryAfter = error.extra?.retryAfter;
    if (typeof retryAfter === "number") headers["Retry-After"] = String(retryAfter);
    return json({ error: { code: error.code, ...error.extra } }, error.status, headers);
  }
  console.error("[amarid] unhandled error:", error);
  return json({ error: { code: "INTERNAL_ERROR" } }, 500);
}

function assertSameOrigin(req: NextRequest): void {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return;
  const origin = req.headers.get("origin");
  if (origin) {
    if (origin !== env().origin) throw new AppError("CROSS_ORIGIN_REFUSED", 403);
    return;
  }
  // Browsers always send Origin or Sec-Fetch-Site on unsafe requests. A request
  // with neither is not a browser and carries no ambient cookies worth forging.
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") throw new AppError("CROSS_ORIGIN_REFUSED", 403);
}

export async function readJson<S extends z.ZodType>(req: NextRequest, schema: S): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError("INVALID_REQUEST", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new AppError("INVALID_REQUEST", 400, undefined, { fields: parsed.error.issues.map((i) => i.path.join(".")) });
  }
  return parsed.data;
}

/** Best-effort client address for rate limiting (first hop behind the platform proxy). */
export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export const userAgent = (req: NextRequest) => req.headers.get("user-agent")?.slice(0, 300) ?? null;
