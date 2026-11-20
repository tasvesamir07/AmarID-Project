"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Shield, Fingerprint, Smartphone, Mail,
  Smile, CheckCircle2, Lock, Sparkles, AlertCircle,
  RefreshCw, Copy, ChevronLeft, UploadCloud, KeyRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/otp-input";
import { IdCard } from "@/components/id-card";
import { useAuth } from "@/lib/auth-context";
import {
  enrollmentStart,
  enrollmentDocument,
  simOtpRequest,
  simOtpVerify,
  emailOtpRequest,
  emailOtpVerify,
  livenessSession,
  livenessResult,
  fingerprintCapture,
  enrollmentFinalize,
  passkeyRegisterOptions,
  passkeyRegister,
  type OtpRequestResult,
  type FinalizeResult,
} from "@/lib/api";

const STEPS = [
  "Welcome",
  "Document",
  "SIM OTP",
  "Email",
  "Face Liveness",
  "Fingerprint",
  "Uniqueness Check",
  "Register Passkey",
  "Your ID Ready",
];

/** Deterministic fingerprint-ish hash of the browser UA — demo only */
function clientFingerprint(): string {
  const raw = [navigator.userAgent, navigator.language, screen.width, screen.height].join("|");
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, "0");
}

/** Minimal stub — generates a random 32-byte base64 "template" for the mock */
function mockFingerprintTemplate(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export default function Onboarding() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Enrollment state (persisted across steps)
  const enrollmentId = useRef<string>("");
  const setupToken = useRef<string>("");
  const [finalResult, setFinalResult] = useState<FinalizeResult | null>(null);

  // Step 1 — Document
  const [docType, setDocType] = useState<"NID" | "PASSPORT">("NID");
  const [docNumber, setDocNumber] = useState("");
  const [docUploaded, setDocUploaded] = useState(false);
  const [phone, setPhone] = useState(""); // collected here for step 2 start call

  // Step 2 — SIM OTP
  const [simChallenge, setSimChallenge] = useState<OtpRequestResult | null>(null);
  const [simOtp, setSimOtp] = useState("");
  const [simDevCode, setSimDevCode] = useState("");
  const [simTimer, setSimTimer] = useState(60);

  // Step 3 — Email OTP (optional)
  const [email, setEmail] = useState("");
  const [emailChallenge, setEmailChallenge] = useState<OtpRequestResult | null>(null);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailDevCode, setEmailDevCode] = useState("");
  const [skipEmail, setSkipEmail] = useState(false);

  // Step 4 — Liveness
  const [liveSessionId, setLiveSessionId] = useState("");
  const [livenessDone, setLivenessDone] = useState(false);

  // Step 5 — Fingerprint
  const [fingerprintDone, setFingerprintDone] = useState(false);

  // Step 6 — Dedup (auto, starts on step enter)
  const [dedupDone, setDedupDone] = useState(false);

  const progress = (step / (STEPS.length - 1)) * 100;
  const clearError = () => setError("");

  // SIM resend timer
  useEffect(() => {
    if (!simChallenge) return;
    setSimTimer(60);
    const iv = setInterval(() => setSimTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(iv);
  }, [simChallenge]);

  // ─── Step handlers ────────────────────────────────────────────────────────

  async function startEnrollment() {
    clearError();
    setLoading(true);
    try {
      const cfp = clientFingerprint();
      const msisdn = "+880" + phone.replace(/\D/g, "");
      const res = await enrollmentStart({
        docType,
        docNumber,
        msisdn,
        email: email || undefined,
        clientFingerprintHash: cfp,
      });
      enrollmentId.current = res.enrollmentId;

      // Also verify document immediately (mock always passes)
      await enrollmentDocument(res.enrollmentId, { docType, docNumber });

      // Request SIM OTP
      const otp = await simOtpRequest(res.enrollmentId, msisdn);
      setSimChallenge(otp);
      // In OTP_DEV_MODE the code is printed to the API console — we also show a hint
      setSimDevCode("(check API console for OTP code — dev mode)");
      setStep(2);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("ENROLLMENT_DUPLICATE") || msg.includes("Conflict")) {
        setError("This document is already registered. If this is you, go to Sign in.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifySimOtp() {
    if (!simChallenge) return;
    clearError();
    setLoading(true);
    try {
      await simOtpVerify(enrollmentId.current, {
        msisdn: "+880" + phone.replace(/\D/g, ""),
        challengeId: simChallenge.challengeId,
        code: simOtp,
      });
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailStep() {
    if (skipEmail || !email) {
      setStep(4);
      return;
    }
    if (!emailChallenge) {
      // Send OTP
      clearError();
      setLoading(true);
      try {
        const otp = await emailOtpRequest(enrollmentId.current, email);
        setEmailChallenge(otp);
        setEmailDevCode("(check API console for email OTP — dev mode)");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to send email OTP");
      } finally {
        setLoading(false);
      }
      return;
    }
    // Verify
    clearError();
    setLoading(true);
    try {
      await emailOtpVerify(enrollmentId.current, {
        email,
        challengeId: emailChallenge.challengeId,
        code: emailOtp,
      });
      setStep(4);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Email OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function startLiveness() {
    clearError();
    setLoading(true);
    try {
      const { sessionId } = await livenessSession(enrollmentId.current);
      setLiveSessionId(sessionId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not start liveness session");
    } finally {
      setLoading(false);
    }
  }

  async function completeLiveness() {
    clearError();
    setLoading(true);
    try {
      await livenessResult(enrollmentId.current, {
        sessionId: liveSessionId,
        faceProbe: btoa("mock-face-probe"),
      });
      setLivenessDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Liveness check failed");
    } finally {
      setLoading(false);
    }
  }

  async function captureFingerprint() {
    clearError();
    setLoading(true);
    try {
      const template = mockFingerprintTemplate();
      await fingerprintCapture(enrollmentId.current, template);
      setFingerprintDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fingerprint capture failed");
    } finally {
      setLoading(false);
    }
  }

  async function runDedupAndFinalize() {
    clearError();
    setLoading(true);
    try {
      const result = await enrollmentFinalize(enrollmentId.current);
      setFinalResult(result);
      setupToken.current = result.setupToken;
      setDedupDone(true);
      // After a short delay, advance to passkey registration
      setTimeout(() => setStep(7), 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("DUPLICATE")) {
        setError("Duplicate identity detected. You already have an AmarID account. Please sign in.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function registerPasskey() {
    clearError();
    setLoading(true);
    try {
      const opts = await passkeyRegisterOptions(setupToken.current);
      // Call WebAuthn browser API
      const { startRegistration } = await import("@/lib/webauthn");
      const response = await startRegistration({ optionsJSON: opts });
      const reg = await passkeyRegister({ setupToken: setupToken.current, response });
      // Set auth context
      if (finalResult) {
        setAuth(reg.identityId, finalResult.universalId);
      }
      setStep(8);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // NotAllowedError = user cancelled the browser dialog
      if (msg.includes("NotAllowedError") || msg.includes("cancelled")) {
        setError("Passkey registration was cancelled. Click the button to try again.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // Auto-run dedup when we land on step 6
  useEffect(() => {
    if (step === 6 && !dedupDone && !loading && enrollmentId.current) {
      runDedupAndFinalize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Auto-start liveness session when we land on step 4
  useEffect(() => {
    if (step === 4 && !liveSessionId && !loading && enrollmentId.current) {
      startLiveness();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div className={`min-h-[90vh] flex flex-col ${lang === "bn" ? "font-bengali" : ""}`}>
      {/* Progress bar */}
      <div className="border-b border-border bg-card/80 backdrop-blur sticky top-16 z-30 px-4 py-3">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground uppercase tracking-wider">
              Step {step + 1} of {STEPS.length}: {STEPS[step]}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLang(lang === "en" ? "bn" : "en")}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                {lang === "en" ? "বাংলা" : "English"}
              </button>
              <span className="font-mono text-muted-foreground">{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <main className="max-w-xl mx-auto py-8 px-4 flex-grow w-full flex items-start justify-center">
        {/* Global error */}
        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full">
            <div className="bg-destructive text-white rounded-xl px-4 py-3 flex items-start gap-3 shadow-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-xs leading-relaxed">{error}</span>
              <button className="ml-auto text-white/70 hover:text-white" onClick={clearError}>✕</button>
            </div>
          </div>
        )}

        <div className="w-full">

        {/* ── STEP 0: Welcome ── */}
        {step === 0 && (
          <Card className="w-full border border-border shadow-xl p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-sm">
              <Shield className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <Badge variant="outline" className="border-primary/30 text-primary">National Digital Identity</Badge>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {lang === "en" ? "Create your Universal ID" : "আপনার ইউনিভার্সাল আইডি তৈরি করুন"}
              </CardTitle>
              <CardDescription className="text-sm max-w-sm mx-auto leading-relaxed">
                {lang === "en"
                  ? "A privacy-first digital credential replacing photocopies, document fraud, and passwords."
                  : "ঝুঁকিপূর্ণ নথিপত্রের ফটোকপি এবং পাসওয়ার্ডের পরিবর্তে একটি সার্বভৌম ডিজিটাল পরিচয়।"}
              </CardDescription>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { icon: Lock, label: "Private", sub: "0 raw biometrics" },
                { icon: Fingerprint, label: "One Person", sub: "Strict dedup" },
                { icon: Smartphone, label: "Local SSO", sub: "OIDC standard" },
              ].map((f) => (
                <div key={f.label} className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-center space-y-1">
                  <f.icon className="w-4 h-4 mx-auto text-primary" />
                  <div className="text-xs font-semibold text-foreground">{f.label}</div>
                  <div className="text-[10px] text-muted-foreground">{f.sub}</div>
                </div>
              ))}
            </div>
            <Button size="lg" className="w-full font-semibold shadow-md" onClick={() => setStep(1)}>
              {lang === "en" ? "Get Started" : "শুরু করুন"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <div className="pt-2 text-xs text-muted-foreground">
              Already registered?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in to your ID
              </Link>
            </div>
          </Card>
        )}

        {/* ── STEP 1: Document + phone collect ── */}
        {step === 1 && (
          <Card className="w-full border border-border shadow-xl p-6 sm:p-8 space-y-5">
            <div>
              <CardTitle className="text-xl font-bold">1. Identity Document</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">We read it once for verification and never keep the image.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["NID", "PASSPORT"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDocType(t)}
                  className={`p-4 rounded-xl border text-left transition-all ${docType === t ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-secondary"}`}
                >
                  <div className="font-semibold text-sm text-foreground">{t === "NID" ? "Smart NID Card" : "Bangladesh Passport"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t === "NID" ? "10 or 17 digit number" : "Machine-Readable / e-Passport"}</div>
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">{docType === "NID" ? "NID Card Number" : "Passport Number"}</label>
              <Input
                placeholder={docType === "NID" ? "e.g. 1982736450" : "e.g. A01234567"}
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
              />
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3 text-primary" />
                Only a one-way cryptographic hash is transmitted.
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Mobile Phone Number (for SIM OTP)</label>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-3 rounded-xl border border-input bg-secondary text-xs font-mono font-medium">+880</span>
                <Input
                  placeholder="1712 345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
            <div
              onClick={() => setDocUploaded(!docUploaded)}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${docUploaded ? "border-emerald-500 bg-emerald-500/5" : "border-border hover:border-primary/50 bg-secondary/30"}`}
            >
              {docUploaded ? (
                <div className="space-y-1">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Document Frame Verified — Ephemeral image purged</div>
                </div>
              ) : (
                <div className="space-y-1">
                  <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
                  <div className="text-xs font-semibold text-foreground">Click to Simulate Document Scan</div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="w-1/3" onClick={() => setStep(0)}>Back</Button>
              <Button
                className="w-2/3"
                disabled={!docNumber || !docUploaded || phone.length < 9 || loading}
                onClick={startEnrollment}
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                {loading ? "Verifying…" : "Verify & Continue"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
            <div className="text-center pt-1 text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in here
              </Link>
            </div>
          </Card>
        )}

        {/* ── STEP 2: SIM OTP ── */}
        {step === 2 && (
          <Card className="w-full border border-border shadow-xl p-6 sm:p-8 space-y-5">
            <div>
              <CardTitle className="text-xl font-bold">2. SIM Verification</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">A 6-digit code was sent to +880 {phone}</p>
            </div>
            {simDevCode && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-700 dark:text-amber-300 font-mono">
                🛠 Dev mode: {simDevCode}
              </div>
            )}
            <div className="flex flex-col items-center space-y-3">
              <label className="text-xs font-semibold text-foreground self-start">Enter 6-Digit Code</label>
              <OtpInput length={6} value={simOtp} onChange={setSimOtp} onComplete={setSimOtp} />
              <div className="text-[11px] text-muted-foreground flex items-center gap-2 self-start">
                {simTimer > 0 ? (
                  <span className="font-mono">Resend in {simTimer}s</span>
                ) : (
                  <button
                    className="text-primary font-semibold hover:underline"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const otp = await simOtpRequest(enrollmentId.current, "+880" + phone.replace(/\D/g, ""));
                        setSimChallenge(otp);
                      } catch (e: unknown) {
                        setError(e instanceof Error ? e.message : "Resend failed");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="w-1/3" onClick={() => setStep(1)}>Back</Button>
              <Button className="w-2/3" disabled={simOtp.length !== 6 || loading} onClick={verifySimOtp}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                {loading ? "Verifying…" : "Verify SIM"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </Card>
        )}

        {/* ── STEP 3: Email (optional) ── */}
        {step === 3 && (
          <Card className="w-full border border-border shadow-xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">3. Security Alert Email</CardTitle>
              <Badge variant="secondary">Optional</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Get notified when partner apps request access or proof-of-life is due.</p>

            {!emailChallenge ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Email Address</label>
                  <Input
                    type="email"
                    placeholder="citizen@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="w-1/2" onClick={() => { setSkipEmail(true); setStep(4); }}>
                    Skip for now
                  </Button>
                  <Button className="w-1/2" onClick={handleEmailStep} disabled={loading}>
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    {email ? "Send Code" : "Continue"}
                    {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {emailDevCode && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-700 dark:text-amber-300 font-mono">
                    🛠 Dev mode: {emailDevCode}
                  </div>
                )}
                <div className="flex flex-col items-center space-y-3">
                  <label className="text-xs font-semibold text-foreground self-start">Enter Email Code</label>
                  <OtpInput length={6} value={emailOtp} onChange={setEmailOtp} onComplete={setEmailOtp} />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="w-1/3" onClick={() => setEmailChallenge(null)}>Back</Button>
                  <Button className="w-2/3" disabled={emailOtp.length !== 6 || loading} onClick={handleEmailStep}>
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    {loading ? "Verifying…" : "Verify Email"}
                    {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}

        {/* ── STEP 4: Liveness ── */}
        {step === 4 && (
          <Card className="w-full border border-border shadow-xl p-6 sm:p-8 space-y-5 text-center">
            <CardTitle className="text-xl font-bold">4. Face Liveness Verification</CardTitle>
            <p className="text-xs text-muted-foreground">Prevents deepfakes and automated bot registrations.</p>
            <div className="relative w-56 h-64 mx-auto rounded-3xl bg-slate-900 border-4 border-primary/40 flex flex-col items-center justify-center text-white overflow-hidden shadow-xl">
              <div className={`w-36 h-48 rounded-[50%] border-2 border-dashed flex items-center justify-center transition-colors ${livenessDone ? "border-emerald-400 bg-emerald-500/10" : "border-emerald-400/80 animate-pulse"}`}>
                {livenessDone ? <CheckCircle2 className="w-16 h-16 text-emerald-400" /> : <Smile className="w-16 h-16 text-emerald-400/60" />}
              </div>
              <div className="absolute bottom-3 inset-x-3 bg-black/70 backdrop-blur-sm p-2 rounded-xl text-center">
                <span className="text-xs font-semibold text-white">
                  {loading ? "Starting session…" : livenessDone ? "3D Liveness Vector Captured ✓" : liveSessionId ? "Position face in oval guide" : "Loading…"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                variant={livenessDone ? "outline" : "default"}
                className="w-full"
                disabled={!liveSessionId || loading}
                onClick={livenessDone ? () => { setLivenessDone(false); startLiveness(); } : completeLiveness}
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                {livenessDone ? "Re-scan" : loading ? "Processing…" : "Simulate Liveness Check"}
              </Button>
              <p className="text-[11px] text-muted-foreground">Raw images are purged immediately. Only a salted embedding is evaluated.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="w-1/3" onClick={() => setStep(3)}>Back</Button>
              <Button className="w-2/3" disabled={!livenessDone} onClick={() => setStep(5)}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* ── STEP 5: Fingerprint ── */}
        {step === 5 && (
          <Card className="w-full border border-border shadow-xl p-6 sm:p-8 space-y-5 text-center">
            <CardTitle className="text-xl font-bold">5. Fingerprint Capture</CardTitle>
            <p className="text-xs text-muted-foreground">Touch your device biometric sensor or simulate below.</p>
            <div
              onClick={!fingerprintDone && !loading ? captureFingerprint : undefined}
              className={`w-36 h-36 mx-auto rounded-3xl border-2 flex items-center justify-center cursor-pointer transition-all ${fingerprintDone ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-md" : "border-primary/40 bg-secondary/50 text-primary animate-pulse"}`}
            >
              {loading ? <RefreshCw className="w-12 h-12 animate-spin text-primary" /> :
               fingerprintDone ? <CheckCircle2 className="w-16 h-16" /> : <Fingerprint className="w-16 h-16" />}
            </div>
            <div className="text-sm font-semibold text-foreground">
              {loading ? "Processing…" : fingerprintDone ? "Minutiae Template Encrypted ✓" : "Tap to simulate touch sensor"}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="w-1/3" onClick={() => setStep(4)}>Back</Button>
              <Button className="w-2/3" disabled={!fingerprintDone} onClick={() => setStep(6)}>
                Continue to Dedup Check <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* ── STEP 6: Dedup (auto) ── */}
        {step === 6 && (
          <Card className="w-full border border-border shadow-xl p-6 sm:p-8 space-y-5 text-center">
            <Badge variant="outline" className="border-primary/30 text-primary mx-auto">National Dedup Engine</Badge>
            <CardTitle className="text-2xl font-bold">Checking you&apos;re the only you</CardTitle>
            <p className="text-xs text-muted-foreground">Running 1:N multi-modal biometric deduplication.</p>
            <div className="p-6 rounded-2xl bg-secondary/40 border border-border space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center text-primary shadow-sm">
                  <Fingerprint className={`w-6 h-6 ${loading ? "animate-pulse" : ""}`} />
                </div>
                <ArrowRight className={`w-4 h-4 text-muted-foreground ${loading ? "animate-pulse" : ""}`} />
                <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center text-primary shadow-sm">
                  <Shield className={`w-6 h-6 ${loading ? "animate-bounce" : ""}`} />
                </div>
                <ArrowRight className={`w-4 h-4 text-muted-foreground ${loading ? "animate-pulse" : ""}`} />
                <div className={`w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm ${dedupDone ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {dedupDone ? <CheckCircle2 className="w-6 h-6" /> : <RefreshCw className="w-6 h-6 animate-spin" />}
                </div>
              </div>
              {dedupDone && (
                <div className="text-emerald-600 font-semibold text-xs font-mono">
                  Zero duplicate biometric collision detected ✓
                </div>
              )}
              {loading && <div className="text-xs text-muted-foreground font-mono">Finalizing enrollment…</div>}
            </div>
          </Card>
        )}

        {/* ── STEP 7: Register Passkey ── */}
        {step === 7 && (
          <Card className="w-full border border-border shadow-xl p-6 sm:p-8 space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <KeyRound className="w-8 h-8" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">7. Secure with Passkey</CardTitle>
              <CardDescription className="text-sm mt-1">
                Register a FIDO2 device-bound passkey so you can sign in without passwords.
              </CardDescription>
            </div>
            {finalResult && (
              <div className="p-3 rounded-xl bg-secondary/40 border border-border text-xs font-mono text-left space-y-1">
                <div><span className="text-muted-foreground">Universal ID: </span><span className="text-foreground font-bold">{finalResult.maskedId}</span></div>
                <div><span className="text-muted-foreground">Assurance: </span><span className="text-primary">{finalResult.assuranceLevel}</span></div>
              </div>
            )}
            <div className="p-3 rounded-xl bg-secondary/40 border border-border text-xs text-muted-foreground">
              Your browser will show a dialog to save a passkey. This binds your AmarID to this device — no password ever stored.
            </div>
            <Button className="w-full font-semibold shadow-md" onClick={registerPasskey} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="mr-2 h-4 w-4" />}
              {loading ? "Registering…" : "Register Passkey Now"}
            </Button>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => { if (finalResult) { setAuth("demo", finalResult.universalId); setStep(8); } }}
            >
              Skip (demo only — passkey will not be saved)
            </button>
          </Card>
        )}

        {/* ── STEP 8: Done ── */}
        {step === 8 && finalResult && (
          <div className="w-full space-y-6 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Universal ID Issued Successfully
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Your Sovereign Digital Identity is Ready</h2>
              <p className="text-xs text-muted-foreground">Bound to this device with FIDO2. Next proof-of-life in 365 days.</p>
            </div>
            <div className="w-full max-w-md mx-auto">
              <IdCard
                name="Registered Citizen"
                maskedId={finalResult.maskedId}
                unmaskedId={finalResult.universalId}
                status="ACTIVE"
                nextProofOfLifeInDays={365}
                badges={[
                  { label: "NID", verified: true },
                  { label: "SIM", verified: true },
                  { label: "Face", verified: true },
                  { label: "Fingerprint", verified: true },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <Button asChild variant="outline" className="w-full">
                <Link href="/id">View Credentials</Link>
              </Button>
              <Button asChild className="w-full shadow-md">
                <Link href="/dashboard">Open Dashboard</Link>
              </Button>
            </div>
          </div>
        )}

        </div>
      </main>
    </div>
  );
}
