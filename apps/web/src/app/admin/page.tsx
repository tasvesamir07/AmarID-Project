"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Shield,
  Activity,
  Clock,
  Plus,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  Key,
  Lock,
  Building2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PartnerItem {
  id: string;
  name: string;
  clientId: string;
  type: string;
  tier: "Regulated" | "Sandbox" | "Commercial";
  verified: boolean;
  scopes: string[];
  activeUsers: string;
}

const PARTNERS: PartnerItem[] = [
  {
    id: "p1",
    name: "Probashi Bank Ltd.",
    clientId: "client_probashi_prod",
    type: "Banking & Financial Service",
    tier: "Regulated",
    verified: true,
    scopes: ["openid", "profile.name", "kyc.level", "status.active"],
    activeUsers: "42,100",
  },
  {
    id: "p2",
    name: "Bazar Local E-Commerce",
    clientId: "client_bazarlocal_promo",
    type: "Retail / E-Commerce",
    tier: "Commercial",
    verified: true,
    scopes: ["openid", "uniqueness.promo"],
    activeUsers: "18,400",
  },
  {
    id: "p3",
    name: "TakaPay MFS",
    clientId: "client_takapay_sandbox",
    type: "Mobile Financial Service",
    tier: "Sandbox",
    verified: false,
    scopes: ["openid", "contact.phone_verified"],
    activeUsers: "520",
  },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "partners" | "fraud" | "audit">("dashboard");
  const [query, setQuery] = useState("");

  const filteredPartners = PARTNERS.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.clientId.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              National Auditor &amp; Admin Console
            </h1>
            <Badge variant="outline" className="border-primary/40 text-primary">
              Strictly Pseudonymous
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time biometric deduplication analytics, partner OIDC management, and audit integrity oversight.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs px-3 py-1">
            Auditor Key: #sec_auditor_92x
          </Badge>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-2 border-b border-border pb-3 overflow-x-auto">
        {[
          { key: "dashboard", label: "Overview", icon: LayoutDashboard },
          { key: "partners", label: "Relying Parties", icon: Users },
          { key: "fraud", label: "Dedup & Fraud Review", icon: Shield },
          { key: "audit", label: "Immutable Audit Log", icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Dashboard Overview */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-border p-5">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Verifications Today
              </div>
              <div className="text-3xl font-extrabold font-mono text-foreground mt-2">1,240</div>
              <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <span>↑ 12% vs yesterday</span>
              </div>
            </Card>

            <Card className="border border-border p-5">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Duplicate Attempts Blocked
              </div>
              <div className="text-3xl font-extrabold font-mono text-destructive mt-2">14</div>
              <div className="text-[11px] text-muted-foreground mt-1">Biometric cosine threshold &gt; 0.88</div>
            </Card>

            <Card className="border border-border p-5">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Proof-of-Life Compliance
              </div>
              <div className="text-3xl font-extrabold font-mono text-foreground mt-2">98.4%</div>
              <div className="text-[11px] text-emerald-600 mt-1 font-medium">Within 365-day schedule</div>
            </Card>

            <Card className="border border-border p-5">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Partner Apps
              </div>
              <div className="text-3xl font-extrabold font-mono text-foreground mt-2">3</div>
              <div className="text-[11px] text-muted-foreground mt-1">Regulated OIDC Relying Parties</div>
            </Card>
          </div>

          {/* Privacy Cues Notice */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <div className="font-semibold text-foreground">Sovereign Privacy Architecture Guarantee</div>
              <p className="text-muted-foreground leading-relaxed">
                This auditor console intentionally strips all personal identifiers, phone numbers, face imagery, and national ID records. All records displayed are cryptographically masked pseudonymous identifiers (e.g. <code className="font-mono bg-card px-1 py-0.5 rounded">sub_8f92•••</code>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Partner Management */}
      {activeTab === "partners" && (
        <Card className="border border-border">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Registered Relying Parties (OIDC Clients)</CardTitle>
              <CardDescription className="text-xs">
                Services authorized to request Universal ID authentication claims.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => alert("Registration modal: Enter Client Name, Redirect URI, and Scopes.")}>
              <Plus className="mr-1.5 h-4 w-4" />
              <span>Register Partner</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="divide-y divide-border/60">
              {filteredPartners.map((p) => (
                <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{p.name}</span>
                      <Badge variant={p.verified ? "success" : "outline"} className="text-[10px]">
                        {p.tier}
                      </Badge>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">Client ID: {p.clientId}</div>
                    <div className="flex items-center gap-1 pt-1 flex-wrap">
                      {p.scopes.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono text-muted-foreground border border-border/50">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 space-y-1 self-end sm:self-center">
                    <div className="text-xs font-mono font-semibold text-foreground">{p.activeUsers} Verified Citizens</div>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Manage Keys
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Fraud Review */}
      {activeTab === "fraud" && (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg">Biometric Deduplication Queue</CardTitle>
            <CardDescription className="text-xs">
              Automated cosine distance analysis flags near-duplicate enrollments for manual forensic audit.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-foreground">Zero Pending Forensic Exceptions</div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              All 14 duplicate attempts today were cleanly rejected by client-side and server-side cryptographic deduplication algorithms.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Immutable Audit Log */}
      {activeTab === "audit" && (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg">Cryptographic Hash-Chained Audit Log</CardTitle>
            <CardDescription className="text-xs">
              Merkle tree roots anchored to prevent retroactive record tampering.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">[2026-11-20T20:14:02Z] OIDC_TOKEN_ISSUED</div>
                  <div className="text-[11px] text-muted-foreground">sub: AID-7K4M-••••-92QX · client: client_probashi_prod</div>
                </div>
                <Badge variant="outline" className="text-[10px]">Block #41209</Badge>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-destructive">[2026-11-20T18:02:11Z] DEDUP_COLLISION_BLOCKED</div>
                  <div className="text-[11px] text-muted-foreground">Biometric similarity vector match 0.94 · Citizen already enrolled</div>
                </div>
                <Badge variant="destructive" className="text-[10px]">Tombstoned</Badge>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">[2026-11-20T16:45:22Z] PROOF_OF_LIFE_RENEWED</div>
                  <div className="text-[11px] text-muted-foreground">sub: AID-3R9N-••••-18LM · Validity extended 365d</div>
                </div>
                <Badge variant="success" className="text-[10px]">Verified</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
