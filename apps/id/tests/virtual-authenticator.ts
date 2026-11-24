// A software passkey authenticator for tests. It produces the same WebAuthn
// messages a phone or laptop would (attestation "none", ES256), so the real
// server-side verification code is exercised without a browser.
import { createHash, createSign, generateKeyPairSync, randomBytes, type KeyObject } from "node:crypto";

const b64u = (b: Uint8Array) => Buffer.from(b).toString("base64url");
const sha256 = (b: Uint8Array | string) => createHash("sha256").update(b).digest();

// Minimal CBOR encoder: just the types an attestation object needs.
function cbor(value: unknown): Buffer {
  const head = (major: number, n: number) => {
    if (n < 24) return Buffer.from([(major << 5) | n]);
    if (n < 256) return Buffer.from([(major << 5) | 24, n]);
    return Buffer.from([(major << 5) | 25, n >> 8, n & 0xff]);
  };
  if (typeof value === "number") return value >= 0 ? head(0, value) : head(1, -1 - value);
  if (typeof value === "string") return Buffer.concat([head(3, Buffer.byteLength(value)), Buffer.from(value)]);
  if (value instanceof Uint8Array) return Buffer.concat([head(2, value.length), value]);
  if (value instanceof Map) {
    return Buffer.concat([head(5, value.size), ...[...value].flatMap(([k, v]) => [cbor(k), cbor(v)])]);
  }
  throw new Error("unsupported CBOR value");
}

type Stored = { id: Buffer; privateKey: KeyObject; userHandle: string; counter: number };

export class VirtualAuthenticator {
  private credentials: Stored[] = [];
  constructor(private readonly origin: string) {}

  private get rpIdHash() {
    return sha256(new URL(this.origin).hostname);
  }

  create(options: { challenge: string; user: { id: string } }) {
    const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const jwk = publicKey.export({ format: "jwk" });
    const id = randomBytes(16);
    this.credentials.push({ id, privateKey, userHandle: options.user.id, counter: 0 });

    const cose = cbor(new Map<number, unknown>([[1, 2], [3, -7], [-1, 1], [-2, Buffer.from(jwk.x!, "base64url")], [-3, Buffer.from(jwk.y!, "base64url")]]));
    const authData = Buffer.concat([
      this.rpIdHash,
      Buffer.from([0x45]), // user present | user verified | attested credential data
      Buffer.alloc(4),
      Buffer.alloc(16), // aaguid
      Buffer.from([0, id.length]),
      id,
      cose,
    ]);
    const clientDataJSON = Buffer.from(JSON.stringify({ type: "webauthn.create", challenge: options.challenge, origin: this.origin, crossOrigin: false }));
    const attestationObject = cbor(new Map<string, unknown>([["fmt", "none"], ["attStmt", new Map()], ["authData", authData]]));
    return {
      id: b64u(id),
      rawId: b64u(id),
      type: "public-key",
      authenticatorAttachment: "platform",
      clientExtensionResults: {},
      response: { clientDataJSON: b64u(clientDataJSON), attestationObject: b64u(attestationObject), transports: ["internal"] },
    };
  }

  get(options: { challenge: string }) {
    const credential = this.credentials[this.credentials.length - 1];
    if (!credential) throw new Error("no credential on this authenticator");
    credential.counter += 1;
    const counter = Buffer.alloc(4);
    counter.writeUInt32BE(credential.counter);
    const authData = Buffer.concat([this.rpIdHash, Buffer.from([0x05]), counter]);
    const clientDataJSON = Buffer.from(JSON.stringify({ type: "webauthn.get", challenge: options.challenge, origin: this.origin, crossOrigin: false }));
    const signature = createSign("SHA256").update(Buffer.concat([authData, sha256(clientDataJSON)])).sign(credential.privateKey);
    return {
      id: b64u(credential.id),
      rawId: b64u(credential.id),
      type: "public-key",
      authenticatorAttachment: "platform",
      clientExtensionResults: {},
      response: {
        clientDataJSON: b64u(clientDataJSON),
        authenticatorData: b64u(authData),
        signature: b64u(signature),
        userHandle: credential.userHandle,
      },
    };
  }
}
