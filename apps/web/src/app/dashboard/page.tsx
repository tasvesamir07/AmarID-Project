"use client";

import { useState } from "react";
import {
  CreditCard,
  Shield,
  Activity,
  Clock,
  LogOut,
  Send,
  CheckCircle2,
  Lock,
  Smartphone,
  ExternalLink,
  Trash2,
  RefreshCw,
  AlertTriangle,
  QrCode,
  FileCheck2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IdCard } from "@/components/id-card";
import { useAuth } from "@/lib/auth-context";

interface ConnectedApp {
  name: string;
  logo: string;
  category: string;
  scopes: string[];
  status: "Connected" | "Revoked";
  lastAccess: string;
}

const INITIAL_APPS: ConnectedApp[] = [
  {
    name: "Bazar Local",
    logo: "B",
    category: "E-Commerce",
    scopes: ["openid", "profile.name", "uniqueness.promo"],
    status: "Connected",
    lastAccess: "2 hours ago",
  },
  {
    name: "Probashi Bank",
    logo: "P",
    category: "Banking / Fintech",
    scopes: ["openid", "kyc.level", "status.active"],
    status: "Connected",
    lastAccess: "Yesterday",
  },
  {
    name: "TakaPay MFS",
    logo: "T",
    category: "Mobile Financial Service",
    scopes: ["openid", "contact.phone_verified"],
    status: "Revoked",
    lastAccess: "5 days ago",
  },
];

export default function Dashboard() {
  const { logout, universalId } = useAuth();
  const [apps, setApps] = useState<ConnectedApp[]>(INITIAL_APPS);

  const toggleRevoke = (name: string) => {
    setApps((prev) =>
      prev.map((app) => {
        if (app.name === name) {
          const nextStatus = app.status === "Connected" ? "Revoked" : "Connected";
          return { ...app, status: nextStatus };
        }
        return app;
      })
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Citizen Dashboard
            </h1>
            <Badge variant="success">Verified LOA3</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your Universal ID credentials, biometric proof-of-life, and authorized partner applications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/activity">
              <Activity className="mr-2 h-4 w-4" />
              <span>Activity Log</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Grid: ID Card Hero + Security Score Ring */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left: Universal ID Card Hero */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-lg">Your Universal Digital Card</CardTitle>
                <CardDescription className="text-xs">
                  Cryptographically bound to your device biometrics.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/id">Manage ID Details</Link>
              </Button>
            </div>

            <div className="w-full max-w-md mx-auto">
              <IdCard
                name="Md. Arifur Rahman"
                maskedId="AID-7K4M-••••-92QX"
                unmaskedId="AID-7K4M-8391-92QX"
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
          </Card>
        </div>

        {/* Right: Security & Assurance Status */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Security &amp; Assurance</CardTitle>
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <CardDescription className="text-xs">
                Real-time compliance with national e-KYC standards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">Identity Status</div>
                    <div className="text-[11px] text-muted-foreground">Active · In good standing</div>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">Proof-of-Life Check</div>
                    <div className="text-[11px] text-muted-foreground">Due in 62 days (Grace period: 30d)</div>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <Link href="/proof-of-life">Verify Now</Link>
                </Button>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">Assurance Level</div>
                    <div className="text-[11px] text-muted-foreground">LOA3 (NID + SIM + Multi-biometrics)</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-foreground">LOA3</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 pt-0">
              <Button asChild variant="outline" size="sm" className="h-10 text-xs justify-start">
                <Link href="/id">
                  <QrCode className="mr-2 h-4 w-4 text-primary" />
                  <span>Show QR</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-10 text-xs justify-start">
                <Link href="/consent">
                  <Shield className="mr-2 h-4 w-4 text-primary" />
                  <span>Test Consent</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-10 text-xs justify-start">
                <Link href="/proof-of-life">
                  <RefreshCw className="mr-2 h-4 w-4 text-primary" />
                  <span>Proof of Life</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-10 text-xs justify-start">
                <Link href="/activity">
                  <Lock className="mr-2 h-4 w-4 text-primary" />
                  <span>Data Vault</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connected Applications with One-Tap Revoke */}
      <Card className="border border-border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Authorized Connected Apps</CardTitle>
            <CardDescription className="text-xs">
              Third-party services where you used “Continue with Universal ID”. You can revoke access at any time.
            </CardDescription>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {apps.filter((a) => a.status === "Connected").length} Active Connections
          </span>
        </CardHeader>

        <CardContent>
          <div className="divide-y divide-border/60">
            {apps.map((app) => (
              <div
                key={app.name}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-sm text-primary border border-border">
                    {app.logo}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{app.name}</span>
                      <span className="text-xs text-muted-foreground">({app.category})</span>
                      <Badge
                        variant={app.status === "Connected" ? "success" : "outline"}
                        className="text-[10px]"
                      >
                        {app.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Scopes:</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {app.scopes.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded bg-secondary/80 border border-border/50 text-[10px] font-mono text-muted-foreground"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs font-mono text-muted-foreground hidden md:inline">
                    Accessed {app.lastAccess}
                  </span>
                  <Button
                    variant={app.status === "Connected" ? "outline" : "secondary"}
                    size="sm"
                    onClick={() => toggleRevoke(app.name)}
                    className={app.status === "Connected" ? "hover:border-destructive hover:text-destructive" : ""}
                  >
                    {app.status === "Connected" ? "Revoke Access" : "Restore Access"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
