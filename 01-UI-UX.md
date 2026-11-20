# AmarID — UI/UX Design Prompt

## Design goal
Create a **modern, trustworthy, calm** interface that feels like a national-grade identity product with the polish of a top fintech app. Users range from first-time smartphone users to professionals, so clarity beats cleverness. **Mobile-first**, fully responsive to desktop.

## Brand and visual language
- **Personality:** secure, sovereign, human, simple. Not cold-governmental, not crypto-hype.
- **Palette (tokens, light + dark):**
  - Primary: deep green `#006A4E` (Bangladesh flag green) with a lighter tint scale
  - Accent: warm red-coral `#F42A41` used sparingly (alerts, key CTA highlights)
  - Neutrals: slate scale; surfaces in soft off-white `#F7F9F8`, dark mode `#0B1210`
  - Semantic: success, warning, danger, info, all WCAG AA on their backgrounds
- **Typography:** Inter (Latin) + **Hind Siliguri or Noto Sans Bengali** (Bangla). Type scale 12/14/16/20/24/32/40. Generous line-height for Bangla.
- **Shape and depth:** 16–24px radii, soft layered shadows, subtle glassmorphism only on the ID card and sheets, 8px spacing grid.
- **Iconography:** Lucide, 1.5px stroke.
- Define everything as **CSS variables / Tailwind theme tokens**; build a small component library on shadcn/ui.

## Signature component: the Universal ID Card
- Credit-card-sized, holographic gradient shimmer on tilt (device orientation / mouse parallax)
- Shows: name, masked Universal ID (e.g. `AID-7K4M-••••-92QX`), verification level badges (NID ✓ SIM ✓ Face ✓ Fingerprint ✓), "Active · next proof-of-life in 62 days"
- Tap to reveal full ID after biometric confirm; QR for in-person verification (rotating, time-limited)
- Never shows NID number or photo by default

## Core flows and screens

### 1. Onboarding / Signup (step wizard with progress, resumable)
1. Welcome: value prop in 3 swipeable cards (Private · One person one ID · Made for Bangladesh). Language toggle (বাংলা / English) always visible.
2. Choose document: NID or Passport → capture/upload (guided frame, edge detection hint, glare warning). Say clearly: *"We read it once and never keep the image."*
3. SIM verification: enter mobile number → OTP screen (see file 03 for behavior). 6 individual digit boxes, auto-advance, paste support, WebOTP autofill, visible countdown, resend cooldown.
4. Email (optional but recommended): verify with OTP, used for security alerts.
5. **Face liveness:** full-screen camera, circular guide, animated prompts (turn left, blink, smile), real-time quality feedback, success burst. Fallback and accessibility path included.
6. **Fingerprint:** device fingerprint prompt or external scanner step with clear illustration.
7. **Uniqueness check:** an engaging "Checking you're the only you…" animation, then result.
   - Success → ID card reveal animation (confetti kept subtle)
   - Duplicate found → calm, non-accusatory screen explaining that an ID already exists, with recovery and dispute paths
8. Set up login method: passkey/biometric on device, recovery options (trusted device, recovery codes).

### 2. Login
- "Enter Universal ID" → challenge → biometric confirm (passkey / face / fingerprint)
- Alternative: **hardware-tethered verification** — "Use another device" with QR or cable/proximity, showing a clear step guide and a visible proximity/connection indicator
- Clear failure states with remaining attempts; no ambiguous errors

### 3. Home dashboard
- ID card hero, quick actions (Scan to verify, Share with consent, Activity), security score ring, proof-of-life status
- Connected apps list with per-app permissions and **one-tap revoke**

### 4. Consent screen (the most important screen)
- App logo + name + verified-partner badge
- Plain-language list of what will be shared ("Confirm you're over 18 ✓", "Your verified name", **not** your NID number)
- Toggles for optional attributes, "Share" and "Decline" equally prominent
- Biometric confirm on approve; success haptic

### 5. Activity and privacy center
- Timeline: who accessed what, when, from where; filter and export
- "Data we hold" page proving minimal storage: shows hashes exist, raw data does not
- Download my data / delete my ID flow

### 6. Proof-of-life
- Friendly reminder notifications (60/30/7 days), 2-minute liveness re-check, success summary
- Grace-period and "I'm traveling / need help" states

### 7. Admin / Auditor console (desktop)
- Dashboard: verifications/day, duplicate attempts blocked, fraud flags, proof-of-life compliance
- Partner management (register OIDC clients, scopes, keys), audit log viewer
- Never exposes personal data; shows only pseudonymous IDs

### 8. Demo partner site (`apps/demo-rp`)
- A fake local store ("Bazar Local") with a promo coupon, showing "Continue with Universal ID" and a "one person, one coupon" success/blocked state

## UX principles
- **Trust cues everywhere:** padlock micro-copy, "stays on your device" labels, short "why we ask" tooltips
- **Progressive disclosure**, one task per screen, max 3 sentences of copy
- **Error empathy:** say what happened, what to do next, never blame
- **Loading:** skeletons, optimistic UI, meaningful progress for long checks
- **Motion:** Framer Motion springs, 150–300ms, respects `prefers-reduced-motion`
- **Accessibility:** WCAG 2.2 AA, 44px touch targets, screen-reader labels, full keyboard flow, color-blind-safe states, large-text support
- **Low-bandwidth friendly:** lazy-load, compressed assets, offline shell via PWA, works on mid-range Android
- **Localization:** full Bangla + English, Bangla numerals option, no hardcoded strings (i18n keys)

## Deliverables for this file
- Design tokens file, component library (Button, Input, OtpInput, Card, Sheet, Stepper, Toast, Badge, ConsentList, IdCard, CameraCapture)
- All screens above, responsive, with empty/loading/error states
- A Storybook or `/design-system` route showcasing components
- Lighthouse targets: Performance ≥ 90, Accessibility ≥ 95
