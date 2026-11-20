# AmarID — SSO, e-KYC, Cross-Border and Partner Integration Prompt

## 1. "Continue with Universal ID" (OIDC provider)
Implement AmarID as a standards-compliant **OpenID Connect provider**.

- Flows: **Authorization Code + PKCE (S256)** only. No implicit flow. Support `private_key_jwt` for confidential clients; public clients (SPA/mobile) use PKCE.
- Discovery: `/.well-known/openid-configuration`, `/jwks.json`
- Endpoints: `/authorize`, `/token`, `/userinfo`, `/revocation`, `/introspect`, `/end_session`
- Tokens: ID token (ES256), short-lived access token (5–10 min), rotating refresh tokens (only with `offline_access` + explicit consent)
- Mandatory: `state`, `nonce`, exact redirect-URI matching, `iss`/`aud` validation, `acr` claim for assurance level (`aid:loa1` SIM only, `aid:loa2` +document, `aid:loa3` +biometric liveness)
- Request `acr_values` and `max_age` to force fresh biometric auth for sensitive partners
- **Pairwise `sub`** per partner sector (see file 04). Never emit the Universal ID itself unless the partner is a regulated entity with a legal basis and the user consents.

### Scopes and claims
| Scope | Claims | Notes |
|---|---|---|
| `openid` | `sub`, `acr`, `auth_time` | Required |
| `profile.name` | `name_verified: true`, optional `name` | Name only if user opts in |
| `age.over_18` / `age.over_21` | boolean predicate | No DOB shared |
| `contact.phone_verified` | boolean (+ masked number optional) | |
| `contact.email_verified` | boolean (+ email optional) | |
| `uniqueness.promo` | partner-scoped one-person token | Promo abuse prevention |
| `kyc.level` | `basic|standard|enhanced` | Via e-KYC (section 2) |
| `status.active` | boolean | Proof-of-life status |

### Login UX for partners
- Drop-in **button + SDK**: `@amarid/js` (vanilla + React) with `AmarIdButton`, handling PKCE, popup/redirect modes, error states, Bangla/English
- Hosted AmarID login page (the user authenticates on the AmarID origin, never inside the partner page, to prevent phishing); show partner name, verified badge, and requested scopes (consent screen from file 01)

## 2. Instant e-KYC for banks and MFS
Flow:
1. Bank calls `POST /v1/ekyc/requests` (mTLS + signed request) with: required level, attributes needed, purpose, retention period.
2. User receives a **push/QR/deep-link**; sees a clear consent screen listing exactly what the bank will receive and why.
3. User approves with biometric confirmation (+ fresh liveness for `enhanced`).
4. AmarID returns a **signed attestation (JWS / SD-JWT VC)** containing only consented attributes, `kyc.level`, issuance time, expiry, and `status.active`.
5. Bank verifies the signature via JWKS and stores the attestation reference. Subsequent KYC refresh requests re-use the consent if still valid.

Levels:
- `basic`: verified SIM + email
- `standard`: + document verified (NID/passport matched)
- `enhanced`: + biometric liveness within last 90 days and `status.active = true`

Provide: sandbox keys for the demo bank "Probashi Bank" and MFS "TakaPay", OpenAPI spec, Postman collection, webhook events (`consent.revoked`, `identity.status_changed`, `identity.deceased`), and webhook signature verification sample code.

## 3. Cross-border privacy shield
For foreign platforms that require identity verification:
- User generates a **Universal ID Share Token**: a short-lived (≤ 15 min) signed credential (SD-JWT VC) with only predicates the user chooses (e.g., "Bangladeshi resident, over 18, unique verified human"), bound to the verifier's identifier (`aud`) and a nonce
- Verification is by public key (verifiers fetch AmarID JWKS), so there is **no callback and no data transfer** about the user
- Provide a verifier page `/verify` and a small `@amarid/verifier` library; include replay protection and revocation status list (compact bitstring)
- UI: "Share with a foreign service" sheet showing exactly what leaves Bangladesh: *"No NID, no passport, no photos."*

## 4. Promo-abuse prevention for partners
- Partner receives a stable **partner-scoped uniqueness token** per real person
- Partner API: `POST /v1/partners/uniqueness/check { token, campaignId }` → `{ eligible: boolean }` backed by a per-campaign claim ledger
- Multiple SIMs/emails of the same person collapse to the same token → second claim blocked
- Demo this in `apps/demo-rp`: attempt to claim "BAZAR50" twice using two different phone numbers; second attempt is blocked

## 5. Proof-of-life signals for partners
- `status.active` claim plus webhook `identity.status_changed` (`active → dormant → suspended`, `deceased`)
- Banks can query `GET /v1/ekyc/identities/:pairwiseSub/status` (consent-scoped) to flag dormant accounts and mitigate dormant-account fraud
- Never expose cause of status change beyond a coarse reason code

## 6. Partner onboarding and governance
- Admin console flow: register organization → verify legal docs (mock) → create OIDC client → assign scopes (privileged scopes need manual approval) → publish sandbox → go-live checklist
- Per-partner dashboards: auth volume, consent rate, error rate; no personal data
- Audit log entries on every token issue, consent, and revocation
- Policy: partners must declare purpose and retention; violations → client suspension

## 7. Demo script (build a `/demo` guided mode)
1. Citizen signs up (mock NID + SIM OTP + liveness) and receives the Universal ID card
2. A second signup attempt with the same NID and a different SIM → **blocked as duplicate**
3. Bazar Local: "Continue with Universal ID" → consent → logged in; claim promo
4. Same person tries a second account with another SIM → promo **blocked**
5. Probashi Bank: instant e-KYC in under 30 seconds with minimal attributes
6. Foreign site: share token → verified without exposing NID
7. Fast-forward clock → proof-of-life reminder → dormant → bank webhook fires
8. Privacy center: show access timeline and revoke a consent → partner token dies

## 8. Acceptance criteria
- OIDC conformance basics pass (use the OpenID conformance suite checklist or equivalent tests)
- Two partners never see the same `sub` for the same person
- e-KYC end to end in ≤ 30 seconds in the demo
- SDK integrates into the demo site with ≤ 15 lines of code
