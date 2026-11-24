# Security and honesty notes

## What is real and what is simulated

| Area | In this build | Needed for production |
|---|---|---|
| Civil registry check (NID, passport) | **Simulated.** Sandbox registry with test records; an unknown number is registered on first use. | Verification agreements with the Election Commission and the Department of Immigration and Passports. |
| SIM ownership | **Simulated**, same model. | Access to BTRC biometric SIM registration data via an operator or aggregator. |
| SMS | **Simulated.** Messages appear in an on-screen "sandbox phone". Codes are never returned by the API. | An SMS gateway contract. |
| Face liveness | **Real** camera, model and random challenge, analysed on the device and reported by it. | See "Known limits" 1. |
| Face uniqueness (1:N) | **Real**, exact. | Index and enclave for scale; independent accuracy and bias evaluation; a human review queue for borderline scores. |
| Fingerprint | The device's own biometric, through a passkey. | See "Known limits" 2. |
| OpenID Connect provider | **Real**, tested against a certified client library. | Formal OpenID conformance certification. |
| Template protection, sealing, blind indexes, audit chain | **Real.** | Keys in an HSM or KMS with rotation and split custody. |

The sandbox adapters throw when `SANDBOX=false`. A deployment cannot go live while silently "verifying" people against fake data.

## Known limits

1. **The device reports its own face check.** The server issues the unpredictable challenge, binds it to one attempt, enforces single use and timing, and checks the evidence for consistency. It cannot prove the report came from an untampered camera, so a determined attacker with a modified client can submit a chosen embedding. Closing this needs a certified presentation-attack-detection SDK (ISO/IEC 30107-3) with device attestation in a native app, or supervised capture at enrollment points. It plugs in behind `verifyLivenessEvidence`.
2. **Fingerprints are not compared between people.** Browsers cannot read raw fingerprints, by design. The fingerprint unlocks a passkey on the person's own device; uniqueness comes from the face search. Fingerprint uniqueness would need certified scanners at enrollment points and matching against the national AFIS.
3. **"Zero-knowledge" means minimal disclosure here.** Partners learn only the approved facts, as yes/no predicates and pairwise pseudonyms. AmarID itself still sees which partner a person signs in to. Hiding that from the provider requires holder-side credentials with unlinkable presentation (BBS+ or SD-JWT VC), which is roadmap, not built.
4. **The match threshold is a default.** `FACE_MATCH_THRESHOLD` (0.6) separates the sample faces we tested but has not been evaluated on a representative population. It must be tuned on real data before any pilot, with attention to false matches between relatives.
5. **Synced passkeys live in the platform vendor's cloud.** Whether a passkey syncs is decided by the device, not by AmarID. The wallet shows which passkeys are synced. A deployment that must avoid this can require device-bound credentials via attestation, at a cost in convenience.
6. **Client address for rate limiting** is taken from `X-Forwarded-For`. Deploy behind a proxy that overwrites that header.
7. **The operator console** uses one shared token. Production needs staff SSO and per-operator audit identities.

## Threats considered

| Threat | Mitigation |
|---|---|
| One person creates several identities with extra documents or SIMs | Unique document index, unique SIM index, and a 1:N face search at enrollment. |
| A partner tracks a person across services | Pairwise subjects; the Universal ID is never released. |
| A partner asks for more than it needs | Scopes are capped per client at registration; sensitive scopes only for regulated clients; the person can switch off optional scopes; the consent screen shows the exact values. |
| Phishing of credentials | Passkeys are bound to the origin; there is no password or reusable code to phish. |
| Remote relay of a sign-in on another device | The cross-device passkey flow requires Bluetooth proximity. |
| SIM swap | The SIM alone never signs in: recovery also needs a live face match. |
| Authorization code interception or replay | PKCE required, exact redirect match, 60-second single-use codes, replay revokes the grant, `iss` on the response. |
| Open redirect via the authorize endpoint | An unknown client or unregistered redirect URI is shown an error page and never redirected. |
| Cross-site request forgery | SameSite=Lax cookies plus an Origin check on every state-changing request. |
| Enumeration of who is enrolled | The enrollment form reveals nothing about existing identities before SIM and face are proven; recovery answers identically for right and wrong ID/phone pairs. |
| Guessing one-time codes | Five attempts per code, five-minute lifetime, per-number and per-address send limits, keyed-hash storage. |
| Database leak | No document numbers, images or fingerprints exist to leak. Names, dates and templates are sealed; tokens are hashed. Without the master key the dump is not usable. |
| Template leak with the key | Rotate the transform key: every stored template is revoked and unlinkable to the new ones. |
| Insider edits the activity log | Hash chain; verification recomputes every hash. |
| A dead or abandoned identity operated by someone else | Yearly proof of life; overdue identities turn dormant; registry death notices close the identity. |
| Stolen session | Opaque server-side sessions (8 hours), revocable, `__Host-` cookies over HTTPS, strict CSP, no third-party scripts. |

## Reporting

This is a prototype. Please do not use it with real personal data. Report problems to the maintainers privately before disclosing them.
