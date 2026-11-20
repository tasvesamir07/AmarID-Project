# AmarID — Backend Architecture Prompt

## Goal
Build the API and data layer for AmarID as a **modular monolith** (NestJS + TypeScript) with clean module boundaries, PostgreSQL, and Redis. Every external dependency sits behind an interface with a working mock.

## Modules
| Module | Responsibility |
|---|---|
| `identity` | Universal ID lifecycle: create, status, suspend, revoke, recover |
| `enrollment` | Onboarding state machine, document check, SIM check, liveness orchestration |
| `biometrics` | Template enrollment, protected matching, 1:N deduplication |
| `auth` | OTP, passkeys/WebAuthn, sessions (see file 03) |
| `oidc` | OAuth 2.0 / OpenID Connect provider (see file 05) |
| `consent` | Attribute-sharing grants, scopes, revocation |
| `ekyc` | Bank/MFS verification APIs, signed attestations |
| `proof-of-life` | Schedules, re-verification, status transitions |
| `notifications` | Email/SMS/push via adapters |
| `audit` | Append-only, hash-chained audit log |
| `admin` | Partner mgmt, analytics, fraud review |

## Adapter interfaces (each with `Mock*` implementation)
```ts
interface NidProvider      { verify(doc: DocInput): Promise<NidResult> }       // MockNidProvider
interface SimRegistry      { ownerMatches(msisdn, nidRef): Promise<boolean> }  // MockSimRegistry
interface LivenessProvider { verify(session): Promise<LivenessResult> }        // MockLivenessProvider
interface FingerprintMatcher { extract(raw): Promise<Template> }               // MockFingerprintMatcher
interface SmsGateway       { send(to, text): Promise<void> }                   // ConsoleSmsGateway
interface Mailer           { send(msg): Promise<void> }                        // SMTP + preview mailer
```
Mocks must simulate: success, mismatch, timeout, duplicate. Include a `DEMO_SCENARIOS` header/flag to trigger them for judges.

## Enrollment state machine
`STARTED → DOC_VERIFIED → SIM_VERIFIED → EMAIL_VERIFIED(optional) → LIVENESS_PASSED → FINGERPRINT_CAPTURED → DEDUP_CHECKED → ISSUED`
(Failure states: `REJECTED_DUPLICATE`, `REJECTED_DOC`, `REJECTED_LIVENESS`, `EXPIRED`.) Persist each transition, idempotent, resumable for 24h, raw inputs deleted immediately after processing.

## Uniqueness (Sybil resistance)
1. **Document key:** `HMAC-SHA256(server_pepper_in_KMS, normalized_nid_or_passport_number)` → unique constraint. Raw number is never persisted.
2. **SIM key:** `HMAC(msisdn)` with a rule of one active Universal ID per verified SIM owner.
3. **Biometric dedup:** compute protected templates (see file 04) and run 1:N matching against enrolled protected templates; threshold configurable; ambiguous scores go to a **manual review queue** (pseudonymous). Document false-accept/false-reject trade-offs.
4. A person may have multiple SIMs, but they all resolve to the **same** Universal ID, and relying parties get a **per-partner pairwise subject ID** so promo abuse is blocked without cross-partner tracking.

## Data model (PostgreSQL, snake_case, UUID v7 PKs, `created_at/updated_at`)
- `identities(id, universal_id UNIQUE, doc_hmac UNIQUE, status[pending|active|dormant|suspended|revoked|deceased], assurance_level, issued_at, last_proof_of_life_at, next_proof_of_life_due)`
- `bio_templates(id, identity_id, modality[face|finger], protected_blob BYTEA, key_version, created_at)` — encrypted, never plaintext
- `sim_bindings(id, identity_id, msisdn_hmac, msisdn_enc, verified_at, active)`
- `contacts(id, identity_id, email_hmac, email_enc, verified_at)`
- `devices(id, identity_id, webauthn_credential_id, public_key, sign_count, label, last_used_at, revoked_at)`
- `enrollments(id, state, client_fingerprint_hash, expires_at, …)`
- `oidc_clients(id, name, redirect_uris[], scopes[], type, sector_identifier, secret_hash, verified_partner)`
- `consents(id, identity_id, client_id, scopes[], granted_at, revoked_at, expires_at)`
- `pairwise_subjects(identity_id, client_sector, subject UNIQUE)`
- `ekyc_requests(id, client_id, identity_id, level, status, attestation_jws, expires_at)`
- `proof_of_life_events(id, identity_id, due_at, completed_at, method, result, score_bucket)`
- `audit_log(id, actor, action, subject_pseudonym, metadata_jsonb, prev_hash, hash, created_at)` — append-only, hash-chained
- `otp_challenges` live in Redis (see file 03); only outcomes logged in DB

Provide migrations, indexes (partial unique indexes where relevant), and Row-Level Security notes.

## Proof-of-life
- Default cycle **12 months** (configurable), reminders at 60/30/7 days, then `dormant` after a grace period (no service access except recovery), then `suspended`.
- Re-verification = fresh liveness + device-bound biometric assertion, matched against stored protected template.
- **Deceased handling:** authorized registry feed adapter (mock) flips status to `deceased` and revokes all sessions/consents; relying parties get a signed status webhook.
- BullMQ jobs for scheduling; all jobs idempotent.

## API conventions
- REST, versioned `/v1`, OpenAPI 3.1 generated, JSON problem+json errors (`type`, `title`, `code`, `traceId`)
- Idempotency-Key on all POSTs that change state
- Pagination via cursor, ISO-8601 UTC timestamps
- Rate limits per IP, per identity, per client (Redis sliding window)
- Request IDs and OpenTelemetry tracing; structured JSON logs with PII redaction

### Key endpoints (non-exhaustive)
```
POST /v1/enrollments                         start
POST /v1/enrollments/:id/document            upload (processed in memory, never stored)
POST /v1/enrollments/:id/sim/otp/request     \  see file 03
POST /v1/enrollments/:id/sim/otp/verify      /
POST /v1/enrollments/:id/liveness/session    + /result
POST /v1/enrollments/:id/fingerprint
POST /v1/enrollments/:id/finalize            → Universal ID
GET  /v1/me                                  profile + status
GET  /v1/me/activity    GET /v1/me/consents    DELETE /v1/me/consents/:id
POST /v1/me/proof-of-life/start | /complete
POST /v1/ekyc/requests   GET /v1/ekyc/requests/:id   (partner-authenticated)
GET  /.well-known/openid-configuration  /jwks.json   (file 05)
POST /v1/admin/clients   GET /v1/admin/metrics
```

## Quality bar
- Unit tests for state machine, dedup logic, OTP, consent; integration tests with Testcontainers; e2e happy-path + duplicate-blocked scenario
- ≥ 80% coverage on `auth`, `biometrics`, `consent`, `oidc`
- Seed script creating: 3 citizens, 2 partner clients (a shop and a bank), 1 admin
- `docker compose up` runs everything; `make demo` seeds and opens the guided flow
