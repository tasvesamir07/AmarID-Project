"use client";

import { useState } from "react";
import {
  ArrowRight,
  Fingerprint,
  Shield,
  Monitor,
  QrCode,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { passkeyLoginOptions, passkeyLogin } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [mode, setMode] = useState<"id" | "tether">("id");
  const [id, setId] = useState("");
  const [step, setStep] = useState<"enter" | "challenge" | "done">("enter");
  const [attempts, setAttempts] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError("");
    setStep("challenge");

    // Automatically trigger passkey authentication
    await triggerPasskeyAuth();
  };

  const triggerPasskeyAuth = async () => {
    setError("");
    setLoading(true);
    try {
      // 1. Fetch challenge options from API
      const options = await passkeyLoginOptions(id.trim());

      // 2. Call WebAuthn browser API
      const { startAuthentication } = await import("@/lib/webauthn");
      const assertionResponse = await startAuthentication({ optionsJSON: options });

      // 3. Verify assertion with backend
      const res = await passkeyLogin({
        universalId: id.trim(),
        response: assertionResponse,
      });

      // 4. Update local auth state
      setAuth(res.identityId, id.trim());
      setStep("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NotAllowedError") || msg.includes("cancelled")) {
        setError("Biometric confirmation was cancelled. Tap below to try again.");
      } else if (msg.includes("NO_PASSKEY_REGISTERED")) {
        setError("No passkey device is registered for this Universal ID. Please complete onboarding first.");
      } else if (msg.includes("Identity not found") || msg.includes("404")) {
        setError("Universal ID not found. Check the ID format or create a new ID.");
      } else {
        setError(msg || "Authentication failed. Please try again.");
      }
      setAttempts((a) => Math.max(0, a - 1));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    setAuth("demo-citizen-id", "AID-7K4M-8391-92QX");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border border-border shadow-xl rounded-2xl overflow-hidden bg-card">
        {/* Header */}
        <div className="p-6 bg-secondary/50 border-b border-border text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Sign in with AmarID
          </CardTitle>
          <CardDescription className="text-xs">
            Passwordless sovereign identity. Authenticate securely using your device biometrics.
          </CardDescription>
        </div>

        <CardContent className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === "id" ? (
            <>
              {step === "enter" && (
                <form onSubmit={handleStartChallenge} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Universal Identifier (AID)
                    </label>
                    <Input
                      placeholder="AID-7K4M-8391-92QX"
                      value={id}
                      onChange={(e) => setId(e.target.value.toUpperCase())}
                      className="font-mono text-base tracking-wider"
                      autoFocus
                    />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>Format: AID-XXXX-XXXX-XXXX</span>
                      <button
                        type="button"
                        onClick={() => setId("AID-7K4M-8391-92QX")}
                        className="text-primary hover:underline font-medium"
                      >
                        Paste Demo ID
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 text-xs text-muted-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>No password needed. You'll confirm with device biometrics/passkey.</span>
                  </div>

                  <Button type="submit" className="w-full font-semibold shadow-sm" disabled={!id}>
                    <span>Continue to Passkey Verification</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Quick Test Mode
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">1-Click</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Want to test right away without registering a hardware passkey?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full bg-card hover:bg-secondary text-primary font-semibold text-xs border-primary/30"
                      onClick={handleQuickDemoLogin}
                    >
                      Instant Test Login (Demo Account) &rarr;
                    </Button>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase font-mono">
                      <span className="bg-card px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setMode("tether")}
                  >
                    <Monitor className="mr-2 h-4 w-4 text-primary" />
                    <span>Use Another Device (Hardware Tether)</span>
                  </Button>
                </form>
              )}

              {step === "challenge" && (
                <div className="text-center py-4 space-y-5">
                  <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto border-2 border-primary/30 animate-pulse">
                    <Fingerprint className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <div className="text-base font-semibold text-foreground">
                      {loading ? "Waiting for Biometric Prompt…" : "Ready for Biometric Sign-in"}
                    </div>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Touch your fingerprint sensor, use Windows Hello / Touch ID, or follow browser instructions.
                    </p>
                    <div className="text-[11px] font-mono text-muted-foreground pt-1">
                      ID: <span className="text-foreground font-semibold">{id}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="w-full shadow-md"
                      onClick={triggerPasskeyAuth}
                      disabled={loading}
                    >
                      {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-4 w-4" />}
                      <span>{loading ? "Authenticating…" : "Trigger Passkey Prompt"}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-primary/40 text-primary hover:bg-primary/10 text-xs font-semibold gap-1.5"
                      onClick={handleQuickDemoLogin}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Skip Biometrics (Enter Demo Account) &rarr;</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground w-full"
                      onClick={() => { setStep("enter"); setError(""); }}
                    >
                      Change ID
                    </Button>
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    Remaining attempts: <span className="font-bold text-foreground">{attempts}</span>
                  </div>
                </div>
              )}

              {step === "done" && (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl">Authentication Successful</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Device-bound passkey verified cryptographically.
                    </p>
                  </div>
                  <Button asChild className="w-full">
                    <Link href="/dashboard">Enter Citizen Dashboard</Link>
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Hardware-tethered cross-device verification flow */
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-foreground">Cross-Device Tethering</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Scan this QR code using your registered mobile phone to approve desktop sign-in via local BLE or WebSockets.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-border shadow-inner">
                <QrCode className="w-40 h-40 text-slate-900" />
                <div className="text-[10px] font-mono text-slate-500 mt-2 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" /> Pairing Active · 84s Remaining
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border text-xs space-y-1">
                <div className="font-semibold text-foreground">Proximity Requirement</div>
                <div className="text-[11px] text-muted-foreground">
                  Both devices must be within Bluetooth/Wi-Fi proximity to defeat remote relay attacks.
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => setMode("id")}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 bg-secondary/20 border-t border-border flex items-center justify-center text-xs text-muted-foreground">
          <span>First time here?</span>
          <Link href="/onboarding" className="text-primary font-semibold ml-1 hover:underline">
            Create your Universal ID
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
