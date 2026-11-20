# AmarID API Reference

Base URL: `http://localhost:4000` (dev). Versioned `/v1`. OpenAPI 3.1 docs at `/docs`. Errors use `application/problem+json` envelopes: `{ type, title, code, traceId, detail?, statusCode, timestamp, path }`.

## Authentication & OTP (`03-AUTH-OTP-EMAIL.md`)

| Endpoint | Description |
|----------|-------------|
| `POST /v1/otp/request` | Request 6-digit OTP (SMS 5 min / Email 10 min). Returns `challengeId`, `expiresAt`, `resendAvailableAt`. |
| `POST /v1/otp/verify` | Verify OTP. Returns `{ verified, proofToken }`. Single-use, constant-time compare. |
| `POST /v1/otp/resend` | Resend OTP (cooldown 60s → 120s → 300s, max 3). |
| `POST /v1/auth/session` | Issue JWT access (10 min) + rotating refresh (30d). |
| `POST /v1/auth/refresh` | Rotate refresh token; reuse → revoke family. |
| `POST /v1/auth/revoke` | Revoke identity's refresh sessions. |

OTP is never stored plaintext — `HMAC-SHA256(secret, otp + challengeId)` in Redis with TTL.

## Identity (`02-BACKEND-ARCHITECTURE.md`)

| Endpoint | Description |
|----------|-------------|
| `GET /v1/me` | Profile + status (auth required). |
| `GET /v1/me/card` | Universal ID card data (masked ID, badges, proof-of-life). |
| `GET /v1/identities/:universalId/status` | Coarse public status only. |
| `POST /v1/admin/identities/:id/suspend` | Admin suspend. |

## Enrollment (`02-BACKEND-ARCHITECTURE.md`)

State machine: `STARTED → DOC_VERIFIED → SIM_VERIFIED → EMAIL_VERIFIED → LIVENESS_PASSED → FINGERPRINT_CAPTURED → DEDUP_CHECKED → ISSUED`.

| Endpoint | Description |
|----------|-------------|
| `POST /v1/enrollments` | Start enrollment (doc, SIM, client fingerprint). Resumable 24h. |
| `POST /v1/enrollments/:id/document` | NID/Passport check (in-memory, never stored). |
| `POST /v1/enrollments/:id/sim/otp/request` | SIM OTP request. |
| `POST /v1/enrollments/:id/sim/otp/verify` | SIM OTP verify + registry owner match. |
| `POST /v1/enrollments/:id/liveness/session` | Create liveness session. |
| `POST /v1/enrollments/:id/liveness/result` | Liveness result. |
| `POST /v1/enrollments/:id/fingerprint` | Fingerprint capture. |
| `POST /v1/enrollments/:id/finalize` | Dedup → issue Universal ID. |

Duplicate → `REJECTED_DUPLICATE`; generic message (never reveals holder).

## Biometrics

| Endpoint | Description |
|----------|-------------|
| `POST /v1/biometrics/:identityId/templates` | Enroll protected template (face/finger). |
| `GET /v1/biometrics/:identityId/templates` | List templates (metadata only). |
| `POST /v1/biometrics/:identityId/dedup/face` | 1:N dedup (mock matcher). |

## Consent

| Endpoint | Description |
|----------|-------------|
| `POST /v1/me/consents` | Grant attribute scopes to a client. |
| `GET /v1/me/consents` | List consents. |
| `DELETE /v1/me/consents/:id` | Revoke a consent (invalidates tokens within 60s). |

## OIDC — "Continue with Universal ID" (`05-SSO-EKYC-INTEGRATION.md`)

| Endpoint | Description |
|----------|-------------|
| `/.well-known/openid-configuration` | Discovery |
| `/jwks.json` | Public signing keys (ES256, 90-day rotation) |
| `POST /v1/authorize` | Authorization request (PKCE S256, state, nonce) |
| `POST /v1/consent` | User approve/decline scopes |
| `POST /v1/token` | Code + verifier → access/id/refresh tokens (ES256) |
| `POST /v1/userinfo` | Claims from access token |

Pairwise `sub` per partner sector. Scopes: `openid`, `profile.name`, `age.over_18`, `contact.phone_verified`, `uniqueness.promo`, `kyc.level`, `status.active`, `offline_access`.

## e-KYC (`05-SSO-EKYC-INTEGRATION.md`)

| Endpoint | Description |
|----------|-------------|
| `POST /v1/ekyc/requests` | Bank/MFS requests attestation (level basic/standard/enhanced). |
| `POST /v1/ekyc/requests/:id/approve` | Approve + signed JWS attestation. |
| `GET /v1/ekyc/requests/:id` | Get request (client-scoped). |
| `GET /v1/ekyc/identities/:pairwiseSub/status` | Proof-of-life status for partner. |

## Proof-of-life

| Endpoint | Description |
|----------|-------------|
| `POST /v1/me/proof-of-life/start` | Schedule re-verification. |
| `POST /v1/me/proof-of-life/complete` | Complete liveness re-check. |
| `GET /v1/me/proof-of-life/status` | Status + next due. |

## Admin

| Endpoint | Description |
|----------|-------------|
| `GET /v1/admin/metrics` | Verifications, duplicates blocked, compliance. |
| `POST /v1/admin/clients` | Register OIDC client. |
| `GET /v1/admin/clients` | List partners. |

## Security notes
- All external adapters behind interfaces; `Mock*` implementations for offline demo, labeled clearly.
- Rate limits: per destination 5/hr, 10/day; per IP 20/hr; per device 10/hr.
- Cookies `HttpOnly; Secure; SameSite=Lax; __Host-` prefix; CSRF double-submit + Origin check.
