# Architecture

## Shape

```
 Citizen's phone                 AmarID (apps/id)                        Outside systems
┌──────────────────┐     ┌──────────────────────────────┐      ┌───────────────────────────┐
│ Browser          │     │ Next.js                      │      │ Civil registry (NID, DIP) │
│  camera → face   │────▶│  pages + route handlers      │─────▶│ SIM registry (BTRC)       │
│  model (on       │     │  src/server  (domain code)   │      │ SMS gateway               │
│  device)         │     │   enrollment · biometrics    │      └───────────────────────────┘
│  passkey in      │     │   OIDC provider · passes     │        behind src/server/adapters.ts
│  secure chip     │     │   audit · sessions           │        (sandbox implementations today)
└──────────────────┘     └──────────────┬───────────────┘
                                        │
 Partner (apps/partners or any OIDC     │              ┌──────────────┐
 client) ──── OpenID Connect ───────────┘              │ PostgreSQL   │
                                                       └──────────────┘
```

One process, one database. Everything that is usually pushed into a cache — sessions, one-time challenges, rate-limit counters — is a table, written with atomic statements, so the provider runs correctly on several instances without extra infrastructure.

## Enrollment

Each step is reachable only from the one before it, and the attempt is bound to an HttpOnly cookie.

| Step | What happens | What is kept |
|---|---|---|
| 1. Document + SIM | The document is checked with the civil registry (exists, name and birth date match, holder not deceased). The SIM must be registered to the same person. A one-time code is sent. | Blind index of the document number; sealed name, birth date, phone. The document number itself is discarded. |
| 2. Code | The person proves they hold the SIM. Five tries, five minutes, keyed-hash storage. | — |
| 3. Face | The server issues a random three-action challenge. The device analyses the camera locally and returns face embeddings plus evidence that the actions were performed in order. Then two uniqueness checks: this document has no AmarID, and **this face has no AmarID under any other document**. | Protected face template. No image leaves the device. |
| 4. Device | A passkey is created (WebAuthn, user verification required). The identity, phone binding, template and passkey are written in one transaction. | Passkey public key. |

Nothing is revealed about other people until step 3: the first form cannot be used to test whether a given NID is enrolled.

## One person, one ID

Three independent locks:

1. `Identity.docIndex` is unique — one document, one identity.
2. `Phone.phoneIndex` is unique — one SIM, one identity.
3. A 1:N face search at enrollment — one face, one identity, **even with a second document and a second SIM**. This is the lock that stops multi-SIM and multi-document abuse.

Partners inherit the guarantee through the pairwise subject (below): one person is one `sub` at a given partner.

## Data protection

All keys are derived from one master key with HKDF-SHA-256 and a purpose label (`src/server/crypto/keys.ts`).

| Technique | Used for | Property |
|---|---|---|
| **Blind index** — HMAC-SHA-256 with a per-kind key | Document numbers, phone numbers | Uniqueness can be enforced and a registry notice can be matched, without the value being stored. |
| **Sealing** — AES-256-GCM, record context as associated data | Name, birth date, phone, templates, signing keys | A ciphertext copied to another row or column does not open. |
| **Cancelable template** — keyed orthogonal transform (sign flips, permutations, two Walsh–Hadamard mixes), then sealing | Face embeddings | Distances are preserved exactly, so accuracy is unchanged; the stored vector is not in the model's embedding space; rotating the key revokes every template. |
| **Hash only** | Session tokens, authorization codes, client secrets | A database leak yields no usable credential. |
| **Hash chain** with a transaction-level advisory lock | Activity log | Removing or editing an event breaks every later hash. Verified from the operator console. |

Why a face template is not "hashed": a biometric is a fuzzy measurement — two captures of the same face are close, never equal — so a hash would never match again. Claiming otherwise would be wrong; the transform-then-seal design above is the honest equivalent.

## OpenID Connect provider

`src/server/oidc/provider.ts` implements one flow strictly: authorization code with PKCE.

- PKCE (S256) is mandatory for every client. Redirect URIs match exactly. `iss` is returned on the redirect (RFC 9207).
- Codes are single use, valid 60 seconds, stored hashed. Presenting a code twice revokes the grant.
- **Pairwise subjects**: `sub = HMAC(key, sector ‖ identity)`. Stable for one partner, different across partners, and unrelated to the Universal ID.
- Claims are released per approved scope. A shop can ask whether someone is over 18 and receives a boolean; birth date, phone and the KYC record are reserved for clients registered as regulated.
- The KYC record follows the `verified_claims` structure of OpenID Connect for Identity Assurance: what was verified, by which method, when — no document number and no image.
- Access tokens last ten minutes and are checked against the grant on every use, so withdrawing consent takes effect immediately.
- Signing keys are generated once, sealed, and stored; restarts and multiple instances share them.

The demo partners integrate with `openid-client`, a certified relying-party library, with no AmarID-specific code. That is the interoperability test.

## Signing in

- **Passkey** (default). Discoverable credential, user verification required. The fingerprint or face unlock never leaves the device.
- **Another device.** The browser's own cross-device passkey flow (QR code plus a Bluetooth proximity check) covers a computer without a passkey. Proximity is what defeats remote relay of the ceremony.
- **SIM + face** (new or lost device). A one-time code to the registered SIM, then a live face check matched 1:1 against the template. A SIM swap alone fails the face; a look-alike alone fails the SIM. The first step answers identically for right and wrong pairs.

## Verification passes

For sites that are not partners. The person picks facts, a label and a lifetime; AmarID signs a JWT carrying only those facts and a random pass id. Anyone can verify it offline with the public keys, or online at `POST /api/passes/check`, which also reports revocation and identity status. The share link carries the token after `#`, which browsers do not send to servers or in `Referer`.

## Proof of life

`Identity.livenessDueAt` moves forward one year at each successful live check. When it is overdue beyond the grace period, the identity becomes `DORMANT` the next time it is used: partner sign-in, token exchange and passes all refuse. A new check restores it. A death notice from the civil registry names a document; the blind index finds the identity, which is closed and signed out.

## Scaling notes

- The 1:N face search is a linear scan over decrypted templates. It is exact and adequate for a pilot. National scale needs an approximate-nearest-neighbour index inside a trusted execution environment; the function signature (`findDuplicate`) stays the same.
- Rate limiting and challenges in PostgreSQL are correct but not free. Under heavy load they move to a cache without changing callers.
- The on-device face engine (`@vladmandic/human`, MIT) and its models are served from the provider's own origin. No third-party CDN is contacted.
