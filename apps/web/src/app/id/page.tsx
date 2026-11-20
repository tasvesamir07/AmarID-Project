"use client";

import { useState, useEffect } from "react";
import {
  QrCode,
  CheckCircle2,
  Shield,
  Copy,
  Download,
  ArrowRight,
  RefreshCw,
  Edit3,
  Save,
  X,
  Phone,
  Mail,
  User,
  KeyRound,
  Laptop,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IdCard } from "@/components/id-card";
import { useAuth } from "@/lib/auth-context";

export default function IdPage() {
  const { universalId } = useAuth();
  const [copied, setCopied] = useState(false);

  // Profile editable state
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("Md. Arifur Rahman");
  const [phone, setPhone] = useState("+880 1712 345678");
  const [email, setEmail] = useState("arifur.rahman@example.com");
  const [alertSuccess, setAlertSuccess] = useState("");

  const currentUid = universalId || "AID-7K4M-8391-92QX";

  useEffect(() => {
    // Load from local storage if available
    const savedName = localStorage.getItem("amarid-profile-name");
    const savedPhone = localStorage.getItem("amarid-profile-phone");
    const savedEmail = localStorage.getItem("amarid-profile-email");
    if (savedName) setDisplayName(savedName);
    if (savedPhone) setPhone(savedPhone);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const copyId = () => {
    navigator.clipboard?.writeText(currentUid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("amarid-profile-name", displayName);
    localStorage.setItem("amarid-profile-phone", phone);
    localStorage.setItem("amarid-profile-email", email);
    setIsEditing(false);
    setAlertSuccess("Profile details updated successfully!");
    setTimeout(() => setAlertSuccess(""), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Alert banner */}
      {alertSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{alertSuccess}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              My Profile & Universal ID
            </h1>
            <Badge variant="success">LOA3 Sovereign</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your citizen credentials, verified contact channels, and sovereign identity pass.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyId}>
            {copied ? (
              <>
                <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-600" />
                <span>Copied AID</span>
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-4 w-4" />
                <span>Copy ID</span>
              </>
            )}
          </Button>
          <Button
            variant={isEditing ? "ghost" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-1.5"
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 text-primary" />
                <span>Edit Profile</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editable Citizen Information Form */}
      {isEditing ? (
        <Card className="border-2 border-primary/40 bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Edit Citizen Contact Information
            </CardTitle>
            <CardDescription className="text-xs">
              Update how partner apps identify you and where security alerts are delivered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Full Name (Display Name)
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Md. Arifur Rahman"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    Verified Mobile (SIM)
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1712 345678"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    Security Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="gap-1.5">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Hero: Interactive Card */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-md">
          <IdCard
            name={displayName}
            maskedId={currentUid.replace(/-[A-Z0-9]{4}-/, "-••••-")}
            unmaskedId={currentUid}
            status="ACTIVE"
            nextProofOfLifeInDays={62}
            badges={[
              { label: "NID", verified: true },
              { label: "SIM", verified: true },
              { label: "Face", verified: true },
              { label: "Fingerprint", verified: true },
            ]}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>Tap card to toggle full ID or reveal rotating verification QR</span>
        </p>
      </div>

      {/* Citizen Details Summary Card */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">Verified Citizen Profile</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 text-xs text-primary gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Full Name</span>
            </div>
            <div className="font-semibold text-foreground text-sm mt-1">{displayName}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span>Verified Mobile</span>
            </div>
            <div className="font-semibold text-foreground text-sm font-mono mt-1">{phone}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span>Security Email</span>
            </div>
            <div className="font-semibold text-foreground text-sm mt-1 truncate">{email}</div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Actions: QR In-person + SSO Share */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* In-Person Verification Card */}
        <Card className="border border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">In-Person Verification</CardTitle>
              <Badge variant="outline" className="text-[10px]">Rotates 5m</Badge>
            </div>
            <CardDescription className="text-xs">
              Show this rotating QR for airport security, bank counters, or hotel check-ins.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center space-y-4">
            <div className="w-36 h-36 p-3 bg-white border border-border rounded-2xl shadow-sm flex items-center justify-center">
              <QrCode className="w-32 h-32 text-slate-900" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono font-medium text-emerald-600 flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Active Token · 04:42 remaining</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Verifiers confirm cryptographically that you are the real holder without storing your NID number.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Share with Consent Card */}
        <Card className="border border-border flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg">Share with Consent</CardTitle>
            <CardDescription className="text-xs">
              Authorize banks and apps using Bangladesh&apos;s sovereign OpenID Connect standard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Selective Disclosure</div>
                  <div className="text-muted-foreground">Share only &ldquo;Over 18&rdquo;, never date of birth.</div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Biometric Confirmation</div>
                  <div className="text-muted-foreground">Each consent request requires your local face or fingerprint check.</div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Complete Audit Log</div>
                  <div className="text-muted-foreground">Every share is logged permanently in your private timeline.</div>
                </div>
              </div>
            </div>

            <Button asChild className="w-full">
              <Link href="/consent" className="flex items-center justify-center gap-2">
                <span>Test Consent Authorization</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Assurance and Technical Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border p-4 text-center">
          <div className="text-xs text-muted-foreground font-medium">Assurance Level</div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">LOA3</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">High National Standard</div>
        </Card>

        <Card className="border border-border p-4 text-center">
          <div className="text-xs text-muted-foreground font-medium">Document Source</div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">NID (Smart)</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">EC Biometric Verified</div>
        </Card>

        <Card className="border border-border p-4 text-center">
          <div className="text-xs text-muted-foreground font-medium">SIM Pairing</div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">BTRC +880</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Biometric SIM Match</div>
        </Card>

        <Card className="border border-border p-4 text-center">
          <div className="text-xs text-muted-foreground font-medium">Proof-of-Life</div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">62 Days</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Annual Re-check</div>
        </Card>
      </div>
    </div>
  );
}
