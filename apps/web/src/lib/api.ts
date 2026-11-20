/**
 * Thin API client — all calls proxied through Next.js /api/* → localhost:4000/v1/*
 * Sends CSRF token from cookie on mutating requests.
 */

function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)amarid-csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (method !== "GET" && method !== "HEAD") {
    const csrf = getCsrfToken();
    if (csrf) headers["x-csrf-token"] = csrf;
  }

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...opts,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      message = json.detail || json.message || json.error || json.title || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && "success" in parsed && "data" in parsed) {
      return parsed.data as T;
    }
    return parsed as T;
  } catch {
    return text as unknown as T;
  }
}

/* ─── Enrollment ──────────────────────────────────────────────── */

export interface EnrollmentStartResult {
  enrollmentId: string;
  state: string;
  expiresAt: string;
}

export function enrollmentStart(body: {
  docType: string;
  docNumber: string;
  msisdn: string;
  email?: string;
  clientFingerprintHash: string;
}): Promise<EnrollmentStartResult> {
  return request("POST", "/enrollments", body);
}

export function enrollmentDocument(
  enrollmentId: string,
  body: { docType: string; docNumber: string }
) {
  return request("POST", `/enrollments/${enrollmentId}/document`, body);
}

export interface OtpRequestResult {
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
  /** DEV ONLY — OTP code printed in API console / returned when OTP_DEV_MODE=true */
  devCode?: string;
}

export function simOtpRequest(
  enrollmentId: string,
  msisdn: string
): Promise<OtpRequestResult> {
  return request("POST", `/enrollments/${enrollmentId}/sim/otp/request`, { msisdn });
}

export function simOtpVerify(
  enrollmentId: string,
  body: { msisdn: string; challengeId: string; code: string }
) {
  return request("POST", `/enrollments/${enrollmentId}/sim/otp/verify`, body);
}

export function emailOtpRequest(
  enrollmentId: string,
  email: string
): Promise<OtpRequestResult> {
  return request("POST", `/enrollments/${enrollmentId}/email/otp/request`, { email });
}

export function emailOtpVerify(
  enrollmentId: string,
  body: { email: string; challengeId: string; code: string }
) {
  return request("POST", `/enrollments/${enrollmentId}/email/otp/verify`, body);
}

export function livenessSession(enrollmentId: string): Promise<{ sessionId: string }> {
  return request("POST", `/enrollments/${enrollmentId}/liveness/session`);
}

export function livenessResult(
  enrollmentId: string,
  body: { sessionId: string; faceProbe?: string }
) {
  return request("POST", `/enrollments/${enrollmentId}/liveness/result`, body);
}

export function fingerprintCapture(
  enrollmentId: string,
  template: string
) {
  return request("POST", `/enrollments/${enrollmentId}/fingerprint`, { template });
}

export interface FinalizeResult {
  universalId: string;
  maskedId: string;
  status: string;
  assuranceLevel: string;
  setupToken: string;
}

export function enrollmentFinalize(enrollmentId: string): Promise<FinalizeResult> {
  return request("POST", `/enrollments/${enrollmentId}/finalize`);
}

/* ─── Passkey registration ───────────────────────────────────── */

export function passkeyRegisterOptions(setupToken: string) {
  return request("GET", `/auth/passkey/register-options?setupToken=${encodeURIComponent(setupToken)}`);
}

export function passkeyRegister(body: { setupToken: string; response: unknown }) {
  return request<{ identityId: string; csrfToken: string; credentialId: string }>(
    "POST",
    "/auth/passkey/register",
    body
  );
}

/* ─── Passkey login ──────────────────────────────────────────── */

export function passkeyLoginOptions(universalId: string) {
  return request("POST", "/auth/passkey/login-options", { universalId });
}

export function passkeyLogin(body: { universalId: string; response: unknown }) {
  return request<{ identityId: string; csrfToken: string }>("POST", "/auth/passkey/login", body);
}

/* ─── Session ────────────────────────────────────────────────── */

export function sessionLogout() {
  return request("POST", "/auth/logout");
}

export function sessionRefresh() {
  return request("POST", "/auth/refresh");
}
