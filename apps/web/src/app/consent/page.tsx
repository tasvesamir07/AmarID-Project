"use client";

import { useState } from "react";
import {
  ArrowRight,
  Shield,
  CheckCircle2,
  Lock,
  X,
  Fingerprint,
  Smile,
  AlertCircle,
  Building2,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";

interface AttributeItem {
  key: string;
  label: string;
  desc: string;
  valuePreview: string;
  optional: boolean;
  sensitive: boolean;
  disabled?: boolean;
}

const ATTRS: AttributeItem[] = [
  {
    key: "name",
    label: "Verified Full Name",
    desc: "Confirms your legal name to Probashi Bank.",
    valuePreview: "Md. Arifur Rahman",
    optional: false,
    sensitive: false,
  },
  {
    key: "age",
    label: "Over 18 Proof Only",
    desc: "Confirms you meet the age requirement. Your exact birthdate is NOT shared.",
    valuePreview: "True (Over 18)",
    optional: false,
    sensitive: false,
  },
  {
    key: "phone",
    label: "SIM Verification Status",
    desc: "Confirms your phone number is biometric-registered in your name.",
    valuePreview: "Verified SIM (+880 17•• ••••92)",
    optional: true,
    sensitive: false,
  },
  {
    key: "nid",
    label: "NID / Passport Number",
    desc: "Strictly protected. Never transmitted or shared with third parties.",
    valuePreview: "Blocked by Sovereign Policy",
    optional: true,
    sensitive: true,
    disabled: true,
  },
];

export default function Consent() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    name: true,
    age: true,
    phone: true,
  });
  const [stage, setStage] = useState<"review" | "confirming" | "done" | "declined">("review");
  const [authMethod, setAuthMethod] = useState<"fingerprint" | "face">("face");

  const toggle = (k: string) => {
    setToggles((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const handleApprove = () => {
    setStage("confirming");
    // Simulate biometric check completion
    setTimeout(() => {
      setStage("done");
    }, 1800);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg border border-border shadow-xl rounded-2xl overflow-hidden bg-card">
        {/* Partner Header Banner */}
        <div className="p-6 bg-gradient-to-r from-primary to-[#00543e] text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-base text-white shadow-inner">
                P
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight">Probashi Bank Ltd.</span>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-200 text-[10px] bg-white/10">
                    Regulated Bank
                  </Badge>
                </div>
                <div className="text-xs text-emerald-100/80">OIDC Client: client_probashi_prod</div>
              </div>
            </div>
            <Shield className="w-6 h-6 text-emerald-300 opacity-80" />
          </div>

          <CardTitle className="text-xl font-bold text-white">Identity Consent Request</CardTitle>
          <p className="text-xs text-emerald-100/90 mt-1">
            Probashi Bank is requesting permission to verify your identity for Instant Account Opening (e-KYC).
          </p>
        </div>

        {/* Card Body */}
        <CardContent className="p-6 space-y-5">
          {stage === "review" && (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-xl bg-secondary/50 border border-border/60">
                <Lock className="w-4 h-4 text-primary flex-shrink-0" />
                <span>
                  You have full control. Review and choose what attributes to share. No data leaves without your biometric confirmation.
                </span>
              </div>

              {/* Attributes List */}
              <div className="space-y-3">
                {ATTRS.map((a) => {
                  const isChecked = toggles[a.key];
                  return (
                    <div
                      key={a.key}
                      className={`p-3.5 rounded-xl border transition-all ${
                        a.disabled
                          ? "border-destructive/20 bg-destructive/5 opacity-75"
                          : isChecked
                          ? "border-primary/40 bg-secondary/30"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {a.disabled ? (
                            <div className="w-5 h-5 rounded-md bg-destructive/10 text-destructive flex items-center justify-center mt-0.5 flex-shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggle(a.key)}
                              disabled={!a.optional}
                              className="w-5 h-5 rounded border-border text-primary focus:ring-primary mt-0.5 accent-primary cursor-pointer disabled:cursor-not-allowed"
                            />
                          )}
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{a.label}</span>
                              {!a.optional && (
                                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
                            <div className="text-[11px] font-mono text-primary font-medium pt-1">
                              Value: {a.valuePreview}
                            </div>
                          </div>
                        </div>

                        {a.disabled && (
                          <Badge variant="destructive" className="text-[10px]">
                            Protected
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-muted-foreground border-t border-border pt-3">
                Authorized under Bangladesh National Digital Identity Framework · Scopes: <code className="font-mono bg-secondary px-1 py-0.5 rounded">openid profile.name kyc.level</code>
              </div>
            </>
          )}

          {stage === "confirming" && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto animate-pulse">
                <Shield className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">Biometric Confirmation Required</CardTitle>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Confirming with your device-bound biometric passkey…
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary animate-bounce">
                  <Smile className="w-6 h-6" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary animate-bounce delay-100">
                  <Fingerprint className="w-6 h-6" />
                </div>
              </div>
              <div className="text-xs font-mono text-muted-foreground">Generating zero-knowledge token…</div>
            </div>
          )}

          {stage === "done" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">Consent Authorized</CardTitle>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Probashi Bank has received your verified identity claim token. You can review or revoke this permission at any time from your dashboard.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border text-left text-xs font-mono space-y-1">
                <div className="text-muted-foreground">Token ID: tok_9f82c0a1b24e</div>
                <div className="text-muted-foreground">Expires: In 1 hour</div>
                <div className="text-emerald-600 font-semibold">Zero raw credentials exposed ✓</div>
              </div>
            </div>
          )}

          {stage === "declined" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <X className="w-8 h-8" />
              </div>
              <CardTitle className="text-xl">Request Declined</CardTitle>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                No identity data was shared with Probashi Bank. The request has been safely terminated.
              </p>
            </div>
          )}
        </CardContent>

        {/* Card Actions Footer */}
        <CardFooter className="p-6 pt-0 bg-card border-t border-border">
          {stage === "review" && (
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStage("declined")}
              >
                Decline
              </Button>
              <Button
                className="w-full font-semibold shadow-md"
                onClick={handleApprove}
              >
                <span>Authorize &amp; Sign</span>
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          )}

          {stage === "done" && (
            <div className="flex gap-2 w-full">
              <Button asChild className="w-full">
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          )}

          {stage === "declined" && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
