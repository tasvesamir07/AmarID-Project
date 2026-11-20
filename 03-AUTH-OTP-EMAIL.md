# AmarID — Authentication, OTP, Signup/Login and Email Prompt

## Principles
- **Passwordless.** No passwords anywhere. Identity proof = Universal ID + device-bound biometric (passkey) or live biometric verification.
- OTP is for **verifying contact ownership** (SIM, email) and for step-up/recovery, never as the only login factor for an active ID.
- Biometric matching for daily login happens **on the device** via WebAuthn user verification; the server only verifies a signed challenge.

## 1. Signup flow (auth-relevant steps)
1. Start enrollment → server returns `enrollmentId` and an opaque enrollment token (short-lived, bound to client fingerprint).
2. **Mobile OTP (SIM ownership)** → verified, then checked against SIM registry adapter (name on SIM must match document holder).
3. **Email OTP** (optional, recommended).
4. Liveness + fingerprint → dedup → issue Universal ID.
5. **Register passkey** (WebAuthn, `userVerification: "required"`, platform authenticator preferred) on the current device. Offer to add a second device. Generate one-time **recovery codes** (10 codes, shown once, stored hashed with Argon2id).

## 2. OTP specification (strict)
| Rule | Value |
|---|---|
| Length / charset | **6 digits**, generated with CSPRNG (`crypto.randomInt`), no patterns filtering needed |
| Storage | Redis key `otp:{purpose}:{channel}:{hash(destination)}` holding `HMAC-SHA256(secret, otp + challengeId)`; **never store plain OTP** |
| **Validity** | **SMS: 5 minutes. Email: 10 minutes.** Absolute expiry, no extension on resend |
| Single use | Deleted atomically on success (Lua script / `GETDEL`) |
| Max verify attempts | **5 per challenge**, then challenge is locked and a new one is required |
| Resend cooldown | **60 s** first resend, then 120 s, 300 s (exponential), max **3 resends** per challenge |
| Request limits | Per destination: 5/hour, 10/day. Per IP: 20/hour. Per device fingerprint: 10/hour. Beyond → `429` with `Retry-After` |
| Lockout | 10 failed verifications across challenges in 1 hour → 30-minute destination lock + security alert |
| Compare | Constant-time compare (`timingSafeEqual`) |
| Binding | Challenge bound to `enrollmentId`/session, purpose, and IP-risk bucket; OTP for one purpose cannot be used for another |
| Responses | Uniform timing and generic messages to avoid account/number enumeration (e.g. "If this number can be verified, a code was sent") |
| Uniform errors | `OTP_INVALID`, `OTP_EXPIRED`, `OTP_LOCKED`, `OTP_RATE_LIMITED` only |
| Delivery | SMS format: `AmarID: 482913 is your verification code. Valid for 5 minutes. Never share it with anyone.` (include WebOTP `@domain #code` line for autofill) |
| Demo mode | `OTP_DEV_MODE=true` prints OTPs to a dev inbox page; **must refuse to start in production** |

### OTP endpoints
```
POST /v1/otp/request   { purpose, channel: "sms"|"email", destination, enrollmentId? } → { challengeId, expiresAt, resendAvailableAt }
POST /v1/otp/verify    { challengeId, code }  → { verified: true, proofToken }   // proofToken short-lived, single-use
POST /v1/otp/resend    { challengeId }
```
`purpose` enum: `SIGNUP_SIM`, `SIGNUP_EMAIL`, `STEP_UP`, `RECOVERY`, `CHANGE_CONTACT`.

## 3. Login flows
### A. Passkey login (default, on a registered device)
1. User enters Universal ID (or picks from remembered IDs).
2. `POST /v1/auth/challenge` → WebAuthn options (random 32-byte challenge, 2-minute validity, single use).
3. Device prompts face/fingerprint (user verification) → assertion.
4. `POST /v1/auth/verify` → verify signature, origin, RP ID, `signCount` increment, UV flag → issue session.

### B. New or biometric-less device: hardware-tethered verification
- User starts login on Device B (no biometrics). Server creates a **pairing session** with a QR code containing a one-time pairing secret.
- User's registered Device A scans the QR, performs biometric confirmation, and signs a challenge that includes Device B's session public key and a **proximity proof** (BLE/NFC/USB-tether where supported; otherwise same-network check plus a short numeric match code displayed on both screens, number-matching to defeat QR relay/phishing).
- Pairing session lifetime: **90 seconds**, single use, bound to Device B's session key. Server rejects if the tether signal is missing in high-risk logins.

### C. Recovery (lost device)
- Recovery code **or** (SIM OTP **+** fresh face liveness **+** matched against protected template) → register a new passkey; revoke old devices; 24-hour delay on high-value actions and security notifications to all channels.

## 4. Sessions and tokens
- Access token: JWT (ES256), **10 minutes**; refresh token: opaque, **rotating**, 30 days sliding max 90, stored hashed, reuse detection → revoke the family.
- Cookies for the web app: `HttpOnly; Secure; SameSite=Lax; __Host-` prefix; CSRF protection (double-submit + `Origin` check).
- Session binding to device key (DPoP or equivalent) where feasible.
- Step-up required for: viewing full Universal ID, adding/removing devices, changing contacts, approving high-assurance e-KYC, deleting the ID.
- Active-session list with remote logout.

## 5. Email system
- Adapter `Mailer`: SMTP (Nodemailer) or Resend; in dev, a local preview inbox (MailHog/Mailpit).
- Queue emails (BullMQ), retry with backoff, dead-letter queue, delivery status.
- **Templates** (MJML, Bangla + English, dark-mode-safe, plain-text alternative): 
  1. Email verification OTP
  2. Welcome / ID issued (no sensitive data)
  3. New device registered
  4. New login from unfamiliar device
  5. Consent granted / revoked
  6. Proof-of-life reminder (60/30/7 days)
  7. Recovery started / completed
  8. Security alert: lockout, duplicate-attempt notice
- Emails never contain NID numbers, full Universal ID, or links that auto-authenticate. Links are single-use, 15-minute, and open to a screen that requires biometric confirmation.
- SPF, DKIM, DMARC documented in README; unsubscribe applies to reminders only, never security notices.

## 6. Abuse and fraud controls
- Device fingerprint + IP reputation scoring, velocity checks, impossible-travel detection
- CAPTCHA (Turnstile/hCaptcha) only after risk threshold, with accessible alternative
- SIM-swap signal (via adapter) forces step-up and delays recovery
- All auth events written to the audit log with pseudonymous subject

## 7. Tests required
OTP expiry boundary (4:59 vs 5:01), attempt limits, resend cooldown, replay of verified OTP, parallel verify race, cross-purpose reuse, enumeration timing, WebAuthn replay (`signCount`), refresh-token reuse detection, tether-pairing relay attempt.
