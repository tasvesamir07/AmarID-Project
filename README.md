# AmarID

**One person, one digital identity — without handing over your NID.**

AmarID is a privacy-first digital identity for Bangladesh. A person verifies once (NID or passport, a SIM in their own name, a live face check) and receives a single Universal ID. After that they can:

- **sign in** to local apps with a fingerprint instead of "Sign in with Google";
- **open a bank or MFS account** in under a minute, with no document upload;
- **prove a fact** ("I am a real, unique adult") to any website, including foreign ones, without showing a document;

and every share is approved by them, visible in their activity log, and revocable.

> **This repository is a working sandbox.** The product, the cryptography and the OpenID Connect provider are real and tested. The connections to government and telecom systems (NID registry, SIM registry, SMS) are simulated and labelled as such in the UI. [docs/SECURITY.md](docs/SECURITY.md) lists exactly what is real and what a production deployment still needs.

## Run it

Requirements: Node.js 20.19 or newer. Nothing else — a real PostgreSQL is started for you.

```bash
npm install
npm run dev
```

| | |
|---|---|
| Identity provider and citizen wallet | http://localhost:3000 |
| Partner demos (mobile wallet, marketplace, verification abroad) | http://localhost:3001 |
| MCP server for AI agents | http://localhost:3000/api/mcp |
| Operator console | http://localhost:3000/admin (token: `ADMIN_TOKEN` in `.env`) |

`npm run dev` creates `.env` with fresh random secrets, starts PostgreSQL (data in `.data/`), applies migrations, seeds the three demo partners, and runs both apps. Prefer Docker for the database? `docker compose up -d` gives the same database on the same port.

You need a camera for enrollment: the face check is real.

## Five-minute tour

1. **Enroll** at `/enroll`. Any well-formed NID and mobile number work in the sandbox; the one-time code appears in the on-screen "sandbox phone". Pass the face check and create a passkey.
2. **Try to enroll again** with a *different* NID and phone number. The face check recognises you and blocks the second identity.
3. **Marketplace demo** (`:3001/daraz`): collect the new-user voucher with two different phone numbers — it works twice. Then use *Continue with AmarID* — it works once, whatever number you use.
4. **Mobile wallet demo** (`:3001/bkash`): open an account. The wallet receives a signed, verified record; the page shows everything it received and that the ID it got differs from the marketplace's.
5. **Verification abroad** (`:3001/abroad`): prove your nationality, age and name to a service overseas. No passport or document number leaves AmarID.
6. **Wallet** (`/wallet`): remove an app's access, create a verification pass and open its link in a private window, read the activity log.
7. **Proof of life**: in the wallet's sandbox tools, let 13 months pass. The identity turns dormant and partner sign-in stops until you pass a new face check.

Sandbox test data: NID `1000000001` belongs to a person recorded as deceased; SIM `01700000002` is registered to someone else.

## How it is built

```
apps/id         The identity provider and citizen wallet (Next.js, PostgreSQL)
  src/server      Domain code: enrollment, biometrics, OIDC provider, passes, audit
  src/app         Pages and thin route handlers
  src/lib         Code shared with the browser: validation, liveness protocol, i18n
  tests           End-to-end tests over HTTP with a software passkey authenticator
apps/partners   Three concept demos (a mobile wallet, a marketplace, a verification
                service abroad). They share no code with the provider and integrate
                through a certified OpenID Connect client library.
docs            Architecture, security, integration and deployment notes
```

Design decisions worth knowing:

- **One deployable provider, one database.** Sessions, one-time challenges, rate limits and the audit chain all live in PostgreSQL. Fewer moving parts to operate and to secure.
- **Standard protocols, no SDK.** Partners use OpenID Connect (authorization code + PKCE). Sign-in uses WebAuthn passkeys. Nothing proprietary to adopt.
- **Privacy is in the schema.** There is no column that holds a document number, a face image or a fingerprint. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **Simulation is fenced in.** Every external system sits behind an interface in `apps/id/src/server/adapters.ts`. The sandbox implementations refuse to run when `SANDBOX=false`.

## Tests

```bash
npm test                         # unit tests (ID checksum, validation, template protection, sealing)
npm run test:e2e                 # 21 end-to-end tests; needs `npm run dev` running
npm run typecheck
npm run build
```

The end-to-end tests assert the product's promises, including the negative cases: a second enrollment by the same face is blocked; a wrong PKCE verifier, a replayed code and a wrong client secret are rejected; a declined scope is not released; revoked consent stops `userinfo` immediately; an overdue identity cannot sign in to partners; recovery needs both the SIM and the matching face; the audit chain verifies and contains no personal data.

## Languages

The citizen-facing product is in English and Bangla (switch at the top right). Technical pages (`/trust`, `/developers`, `/admin`) are in English.

## Status

A competition prototype. It is not affiliated with the Government of Bangladesh, the Election Commission or any mobile operator, and it must not be used with real personal data.
