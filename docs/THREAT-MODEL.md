# AmarID Threat Model

Method: **STRIDE** across the main flows. Assets, attackers, mitigations, residual risk. All biometric/personal data assumptions are honest — this prototype uses **mock adapters** and a **mock matcher**; production requires certified biometric engines, HSM/KMS, and formal ISO/IEC 24745 template-protection evaluation.

## Scope
Enrollment, OTP, login (passkey + tethered), SSO/OIDC, e-KYC, proof-of-life, admin console, partner API.

## Threat register

| # | Threat (STRIDE) | Asset | Attacker | Mitigation | Residual risk |
|---|-----------------|-------|----------|------------|---------------|
| T1 | Spoofing: stolen NID + victim's SIM (SIM swap) | Universal ID issuance | Criminal | SIM registry owner-match check; step-up on SIM-swap signal; recovery delay + notifications | SIM swap before registry update |
| T2 | Spoofing: deepfake / injection vs liveness | Face template | Criminal | Active liveness challenge-response, presentation attack detection, camera-stream signing (mobile), integrity attestation | Web fallback easier to spoof |
| T3 | Tampering: alter enrollment result | Enrollment state | Insider / criminal | State machine persisted, idempotent, transitions audited; raw inputs deleted after processing | Logic bug in state machine |
| T4 | Information disclosure: insider DB access | Bio templates, doc HMACs | Insider | Templates AES-256-GCM encrypted under KEK in KMS; NID stored only as HMAC with pepper in KMS; no raw biometrics/NID | Key compromise (see T9) |
| T5 | Information disclosure: malicious RP correlation | Pairwise subject | Criminal RP | Pairwise pseudonymous `sub` per partner sector; no cross-partner linking | RPs colluding out-of-band |
| T6 | Spoofing: phishing "Continue with Universal ID" / consent spoofing / QR relay | User session | Criminal | Login on AmarID origin (not in partner iframe); consent screen shows partner badge + scopes; hardware-tethered login; numeric match code defeats QR relay | User ignores UI cues |
| T7 | Spoofing: compromised partner credentials | Partner tokens | Criminal | mTLS for banks, client secret + private_key_jwt, short-lived tokens, refresh rotation + reuse detection | Stolen long-lived client secret |
| T8 | Repudiation: deny consent / action | Audit log | User / partner | Append-only hash-chained audit log; every consent/token/revocation logged | None meaningful |
| T9 | Key compromise | Signing/encryption keys | Criminal / insider | Envelope encryption, 90-day JWKS rotation with overlap, KMS abstraction, re-keying procedure | Key material exfil before rotation |
| T10 | Denial of service: mass-enrollment bots / promo farms | Enrollment, OTP endpoints | Criminal | Rate limits per IP/destination/device, CAPTCHA after risk threshold, velocity checks | Slower legit signups during attack |
| T11 | Elevation: admin console abuse | Admin actions | Insider | Two-person approval for sensitive ops, all audited, RLS notes, no personal data exposed | Compromised admin pair |
| T12 | Information disclosure: deceased handling | Status feed | Authorized registry | Deceased registry adapter (mock) flips status, revokes sessions/consents, signed webhook to RPs | False positive in registry feed |

## Privacy claims (honest, scoped)
- Not "zero-knowledge" overall. Zero-knowledge / selective disclosure applies only to specific predicates: `over_18`, `holds active Universal ID`, `KYC level ≥ 2`, via SD-JWT VC / BBS+ with a documented upgrade path to zk-SNARK predicates.
- Biometric templates: cancelable/protected template + AES-256-GCM encryption; fuzzy matching has FAR/FRR trade-offs; thresholds configurable; ambiguous scores → manual review queue.
- Raw biometrics, NID/passport numbers, document images: never stored. Processed in memory, zeroed after.

## Deployment & legal assumptions
- All identity data and keys remain in Bangladesh-hosted infrastructure.
- Maps to Bangladesh data protection / cyber security rules, NID Act, BTRC SIM registration rules — **must be verified with legal counsel**, not asserted.
