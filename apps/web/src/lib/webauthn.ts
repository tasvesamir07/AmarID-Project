/**
 * Minimal WebAuthn browser helper without external dependencies.
 * Uses native window.navigator.credentials.create() and get().
 */

function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    buffer[i] = rawData.charCodeAt(i);
  }
  return buffer.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function startRegistration(options: { optionsJSON: any }) {
  if (typeof window === "undefined" || !window.navigator?.credentials?.create) {
    throw new Error("WebAuthn / Passkeys are not supported by this browser.");
  }

  const { optionsJSON } = options;

  const publicKey: PublicKeyCredentialCreationOptions = {
    ...optionsJSON,
    challenge: base64UrlToBuffer(optionsJSON.challenge),
    user: {
      ...optionsJSON.user,
      id: base64UrlToBuffer(optionsJSON.user.id),
    },
    excludeCredentials: optionsJSON.excludeCredentials?.map((cred: any) => ({
      ...cred,
      id: base64UrlToBuffer(cred.id),
    })),
  };

  const credential = (await window.navigator.credentials.create({
    publicKey,
  })) as PublicKeyCredential;

  if (!credential) {
    throw new Error("No credential was returned from authenticator.");
  }

  const response = credential.response as AuthenticatorAttestationResponse;

  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    response: {
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      attestationObject: bufferToBase64Url(response.attestationObject),
      transports: (response as any).getTransports ? (response as any).getTransports() : ["internal"],
    },
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}

export async function startAuthentication(options: { optionsJSON: any }) {
  if (typeof window === "undefined" || !window.navigator?.credentials?.get) {
    throw new Error("WebAuthn / Passkeys are not supported by this browser.");
  }

  const { optionsJSON } = options;

  const publicKey: PublicKeyCredentialRequestOptions = {
    ...optionsJSON,
    challenge: base64UrlToBuffer(optionsJSON.challenge),
    allowCredentials: optionsJSON.allowCredentials?.map((cred: any) => ({
      ...cred,
      id: base64UrlToBuffer(cred.id),
    })),
  };

  const assertion = (await window.navigator.credentials.get({
    publicKey,
  })) as PublicKeyCredential;

  if (!assertion) {
    throw new Error("No assertion returned from authenticator.");
  }

  const response = assertion.response as AuthenticatorAssertionResponse;

  return {
    id: assertion.id,
    rawId: bufferToBase64Url(assertion.rawId),
    response: {
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      authenticatorData: bufferToBase64Url(response.authenticatorData),
      signature: bufferToBase64Url(response.signature),
      userHandle: response.userHandle ? bufferToBase64Url(response.userHandle) : null,
    },
    type: assertion.type,
    clientExtensionResults: assertion.getClientExtensionResults(),
  };
}
