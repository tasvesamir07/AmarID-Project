// Browser-side helper for our own JSON API.

export class ApiError extends Error {
  constructor(public readonly code: string, public readonly status: number, public readonly extra: Record<string, unknown> = {}) {
    super(code);
  }
}

export async function call<T = Record<string, unknown>>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("NETWORK", 0);
  }
  const data = (await res.json().catch(() => null)) as { error?: { code?: string } & Record<string, unknown> } | null;
  if (!res.ok) {
    const { code, ...extra } = data?.error ?? {};
    throw new ApiError(code ?? "UNKNOWN", res.status, extra);
  }
  return data as T;
}

export const errorCode = (error: unknown): string => (error instanceof ApiError ? error.code : "UNKNOWN");
