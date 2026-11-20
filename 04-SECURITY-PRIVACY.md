# AmarID — Security and Privacy Prompt

## Security posture
Assume breach. Design so that a full database leak reveals **no usable biometrics, no raw NID/passport numbers, and no ability to impersonate a user**.

## 1. Data minimization (what is and isn't stored)
| Data | Raw stored? | What we keep |
|---|---|---|
| Face image / video | **No** | Protected template only |
| Fingerprint image | **No** | Protected template only |
| NID / Passport number | **No** | `HMAC(pepper, normalized_number)` for uniqueness |
| Document image | **No** | Nothing; processed in memory, then zeroed |
| Mobile number / email | Encrypted | Encrypted value (for notifications) + HMAC (for lookup) |
| Name, DOB | Minimal | Only derived attributes: `over_18`, `name_verified`, encrypted name if user opts in |
| OTPs | **No** | HMAC in Redis with TTL |

Raw uploads go to memory streams only. Disable request-body logging on enrollment routes. Scrub temp files and swap. Add automated tests that scan the DB and logs for planted fake NID/face payloads after an enrollment and fail if found.

## 2. Biometric template protection (be technically honest)
Biometrics are noisy, so a plain hash cannot be matched. Implement and document this layered approach:
1. **On-device first:** daily login uses WebAuthn/OS biometrics; raw biometrics never leave the phone.
2. **Enrollment templates:** extract embeddings/minutiae server-side in an isolated enclave-style worker (no network egress, memory-only), then convert to a **protected template** using one of: *fuzzy commitment / secure sketch + fuzzy extractor*, or *cancelable biometrics* (user-specific random projection/BioHashing), then encrypt with **AES-256-GCM** under a per-record DEK wrapped by a KMS-held KEK.
3. **Deduplication matching** runs inside the isolated matcher on protected templates (or encrypted-domain similarity if implemented); the main API never sees templates.
4. Keep **thresholds configurable** and publish the demo's FAR/FRR assumptions. State clearly in `docs/THREAT-MODEL.md` that this prototype uses a **mock matcher**, and what a production deployment (certified biometric engine, HSM, formal ISO/IEC 24745 template-protection evaluation) would add.
5. **Zero-knowledge:** use ZK/selective-disclosure only where it genuinely fits, such as proving `over_18`, "holds an active Universal ID", or "KYC level ≥ 2" without revealing the underlying data, via **SD-JWT VC** or BBS+ signatures, with a documented upgrade path to zk-SNARK predicates. Do **not** claim the whole system is zero-knowledge; label each privacy guarantee precisely.

## 3. Cryptography standards
- TLS 1.3 only, HSTS preload, modern cipher suites; mTLS between internal services and for bank partners
- Passwords: none. Hashing of recovery codes: **Argon2id**
- Signing: **EdDSA or ES256**, JWKS with **90-day rotation** and overlap; key IDs on every token
- Symmetric: AES-256-GCM, unique nonces, AAD includes record ID and key version
- Key management: envelope encryption; KMS/Vault abstraction (`KeyService`), dev uses a local file KMS flagged **non-production**
- Pepper and HMAC keys in KMS, versioned, with a re-keying procedure documented
- No custom crypto; use vetted libraries (libsodium, `jose`, `@simplewebauthn`)

## 4. Application security (OWASP ASVS L2 target)
- Input validation everywhere (Zod/class-validator), output encoding, parameterized queries only
- Strict **CSP** (nonce-based), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (camera only where needed), COOP/COEP where compatible
- CSRF protection, SameSite cookies, CORS allow-list per environment
- SSRF guards on any URL fetch (e.g. client logo, webhook); webhook signing (HMAC + timestamp, 5-min tolerance)
- Rate limiting + bot controls (see file 03), request size limits, upload type sniffing
- Dependency scanning (npm audit, Trivy), secret scanning (gitleaks), SAST (Semgrep), SBOM generation in CI
- Secure defaults for containers: non-root, read-only FS, dropped capabilities

## 5. Anti-spoofing and fraud
- **Presentation attack detection:** active liveness (challenge-response), passive texture/depth cues, replay/injection detection (virtual camera and emulator checks, integrity attestation via Play Integrity / App Attest where available)
- Camera-stream signing to resist injection attacks in the mobile build; document limitations of the web fallback
- Hardware-tethered login to resist remote relay (see file 03)
- Risk engine: device reputation, velocity, geo anomalies, SIM-swap indicators, repeated failed dedup attempts → manual review
- **Duplicate attempt handling:** never reveal *who* already holds the ID; respond with a generic "an ID may already exist; start recovery or dispute"

## 6. Privacy by design
- **Pairwise pseudonymous subject IDs** per relying party (sector identifiers) to prevent cross-site tracking; promo-abuse checks use a partner-scoped uniqueness token
- **Selective disclosure:** partners request the minimum scopes; user sees them in plain language and can deny optional ones
- Cross-border token carries only: pairwise subject, assurance level, issuance time, optional predicates (e.g., `over_18`). It never carries NID/passport data
- User rights: data export, consent history, revoke any consent, **delete/close ID** (crypto-shred keys, keep only a minimal tombstone to prevent re-use abuse, explained to the user)
- Retention schedule documented; audit logs pseudonymous and hash-chained for tamper evidence
- Data residency: all identity data and keys remain in Bangladesh-hosted infrastructure (document the deployment assumption)
- Legal alignment: document how the design maps to applicable Bangladesh law and policy (data protection and cyber security rules, NID Act, BTRC SIM registration rules) and flag that **current legal text must be verified with counsel** rather than asserted

## 7. Threat model (generate `docs/THREAT-MODEL.md`)
Use **STRIDE** across: enrollment, OTP, login, SSO, e-KYC, proof-of-life, admin console, partner API. For each threat list: asset, attacker, mitigation, residual risk. Must explicitly cover:
- Stolen NID + victim's SIM (SIM swap) attack
- Deepfake / injection attack against liveness
- Insider with DB access; insider with admin console access
- Malicious relying party collecting correlation data
- Phishing of "Continue with Universal ID" (consent-screen spoofing, QR relay)
- Compromised partner credentials
- Mass-enrollment bots and promo farms
- Key compromise and recovery plan
- Government/overreach concerns: describe governance safeguards (independent audit, transparency reports, no central biometric image database, user-visible access logs)

## 8. Operations
- Centralized logs with PII redaction; alerting on anomaly spikes (OTP failures, dedup hits)
- Backups encrypted, restore drills; documented RPO/RTO
- Incident response runbook and breach-notification template
- Admin actions require two-person approval for sensitive operations (e.g., manual dedup resolution, status override), all audited

## 9. Acceptance checklist
- [ ] DB/log scan finds no raw biometrics or NID numbers after full enrollment
- [ ] Token replay, OTP brute-force, refresh reuse, and CSRF tests pass
- [ ] Pairwise subjects differ per partner for the same person
- [ ] Revoking a consent invalidates tokens within 60 seconds
- [ ] Threat model and privacy claims reviewed with honest limitations listed
