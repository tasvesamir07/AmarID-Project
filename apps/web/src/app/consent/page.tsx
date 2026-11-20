"use client";

import { useState, useEffect } from "react";
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
  Info,
  HelpCircle,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";

export default function Consent() {
  const [citizenName, setCitizenName] = useState("Mohammad Rahman");
  const [citizenPhone, setCitizenPhone] = useState("+880 1712 345678");
  const [citizenDob, setCitizenDob] = useState("1998-05-14");
  const [citizenDocType, setCitizenDocType] = useState("Smart NID");
  const [citizenAid, setCitizenAid] = useState("AID-7K4M-8391-92QX");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const name = localStorage.getItem("amarid-profile-name");
    const phone = localStorage.getItem("amarid-profile-phone");
    const dob = localStorage.getItem("amarid-profile-dob");
    const docType = localStorage.getItem("amarid-profile-doctype");
    const aid = localStorage.getItem("amarid-profile-aid");

    if (name) setCitizenName(name);
    if (phone) setCitizenPhone(phone);
    if (dob) setCitizenDob(dob);
    if (aid) setCitizenAid(aid);
    if (docType) {
      setCitizenDocType(
        docType === "NID"
          ? "Smart NID"
          : docType === "BIRTH_CERT"
          ? "Birth Certificate"
          : "Bangladesh Passport"
      );
    }
  }, []);

  // Compute citizen age
  const calculateAge = (d: string) => {
    if (!d) return 26;
    const b = new Date(d);
    if (isNaN(b.getTime())) return 26;
    const today = new Date();
    let a = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) a--;
    return a;
  };
  const age = calculateAge(citizenDob);

  // Mask phone for privacy
  const maskPhone = (p: string) => {
    const digits = p.replace(/\D/g, "");
    if (digits.length < 6) return "+880 17•• ••••92";
    const start = digits.slice(-10, -8);
    const end = digits.slice(-2);
    return `+880 ${start}•• ••••${end}`;
  };

  const attrs = [
    {
      key: "name",
      label: "Verified Full Name",
      desc: "Confirms your legal citizen name as recorded on official registers.",
      valuePreview: citizenName,
      optional: false,
      sensitive: false,
    },
    {
      key: "age",
      label: "Over 18 Proof Only (Zero-Knowledge Age Claim)",
      desc: "Confirms you meet age requirements for banking. Your exact birthdate is NEVER disclosed.",
      valuePreview: `True (Age ${age} — ${age >= 18 ? "Over 18 Adult" : "Minor Citizen"})`,
      optional: false,
      sensitive: false,
    },
    {
      key: "phone",
      label: "SIM Verification Status",
      desc: "Confirms your mobile number is biometric-registered to your identity.",
      valuePreview: `Verified SIM (${maskPhone(citizenPhone)})`,
      optional: true,
      sensitive: false,
    },
    {
      key: "nid",
      label: `${citizenDocType} Raw Number`,
      desc: "Strictly protected by Sovereign Data Vault. Third parties never see raw numbers.",
      valuePreview: "Blocked by Sovereign Privacy Policy",
      optional: true,
      sensitive: true,
      disabled: true,
    },
  ];

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    name: true,
    age: true,
    phone: true,
  });
  const [stage, setStage] = useState<"review" | "confirming" | "done" | "declined">("review");

  const toggle = (k: string) => {
    setToggles((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const handleApprove = () => {
    setStage("confirming");
    setTimeout(() => {
      setStage("done");
    }, 1600);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 space-y-6">
      {/* Educational Banner: What is Consent? */}
      <div className="w-full max-w-lg p-4 rounded-2xl bg-secondary/60 border border-primary/20 flex items-start gap-3 shadow-sm">
        <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="font-bold text-foreground">💡 What is Identity Consent?</div>
          <p className="text-muted-foreground leading-relaxed">
            In AmarID, apps (like <strong className="text-foreground">Probashi Bank</strong>) can never take photocopies of your documents or steal your credentials. Instead, they request a <strong className="text-foreground">Consent Token</strong> for specific attributes. You choose what to share, and sign with your biometric passkey.
          </p>
        </div>
      </div>

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
                {attrs.map((a) => {
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
                              Value: <span className="font-bold">{a.valuePreview}</span>
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
                  Authorizing consent for <span className="text-foreground font-semibold">{citizenName}</span> with device-bound passkey…
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
              <div className="text-xs font-mono text-muted-foreground">Generating zero-knowledge verifiable credential…</div>
            </div>
          )}

          {stage === "done" && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">Consent Authorized Successfully</CardTitle>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Probashi Bank received your verified identity claim token for citizen{" "}
                  <strong className="text-foreground">{citizenName}</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border text-left text-xs font-mono space-y-1.5">
                <div className="text-muted-foreground">Universal ID: <span className="text-foreground font-semibold">{citizenAid}</span></div>
                <div className="text-muted-foreground">Authorized Name: <span className="text-foreground font-semibold">{citizenName}</span></div>
                <div className="text-muted-foreground">Verified Age: <span className="text-emerald-600 font-semibold">{age >= 18 ? "Over 18 (True)" : "Minor (True)"}</span></div>
                <div className="text-muted-foreground">Verified Phone: <span className="text-foreground">{maskPhone(citizenPhone)}</span></div>
                <div className="text-emerald-600 font-semibold pt-1 border-t border-border flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Zero raw documents or biometrics were shared.</span>
                </div>
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
