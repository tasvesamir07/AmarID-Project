"use client";

import { browserSupportsWebAuthn, startAuthentication, startRegistration, WebAuthnError } from "@simplewebauthn/browser";
import { ApiError, call } from "./api-client";

type Options = Parameters<typeof startRegistration>[0]["optionsJSON"];

function translate(error: unknown): never {
  if (error instanceof ApiError) throw error;
  if (error instanceof WebAuthnError && error.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") throw new ApiError("PASSKEY_ALREADY_ON_DEVICE", 0);
  const name = (error as { name?: string })?.name;
  // The person dismissed the system prompt, or it timed out.
  if (name === "NotAllowedError" || name === "AbortError") throw new ApiError("PASSKEY_CANCELLED", 0);
  throw new ApiError("PASSKEY_FAILED", 0);
}

function assertSupported(): void {
  if (!browserSupportsWebAuthn()) throw new ApiError("PASSKEY_UNSUPPORTED", 0);
}

/** Creates a passkey: `endpoint` POST returns options, PUT verifies the result. */
export async function createPasskey<T = Record<string, unknown>>(endpoint: string): Promise<T> {
  assertSupported();
  try {
    const { options } = await call<{ options: Options }>("POST", endpoint);
    const response = await startRegistration({ optionsJSON: options });
    return await call<T>("PUT", endpoint, response);
  } catch (error) {
    translate(error);
  }
}

/** Signs in with a passkey on this device, or on a nearby phone via the browser's QR flow. */
export async function signInWithPasskey(): Promise<void> {
  assertSupported();
  try {
    const { attemptId, options } = await call<{ attemptId: string; options: Parameters<typeof startAuthentication>[0]["optionsJSON"] }>("POST", "/api/auth/passkey");
    const response = await startAuthentication({ optionsJSON: options });
    await call("PUT", "/api/auth/passkey", { attemptId, response });
  } catch (error) {
    translate(error);
  }
}
