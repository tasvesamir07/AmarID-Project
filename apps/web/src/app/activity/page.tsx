"use client";

import { useState } from "react";
import {
  Clock,
  Shield,
  Search,
  Filter,
  Download,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Smartphone,
  Eye,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface LogEntry {
  id: string;
  who: string;
  logo: string;
  what: string;
  when: string;
  location: string;
  status: "approved" | "blocked" | "revoked";
  scopes: string[];
}

const INITIAL_LOGS: LogEntry[] = [
  {
    id: "log_1",
    who: "Bazar Local",
    logo: "B",
    what: "One person, one promo coupon claim check",
    when: "10 minutes ago",
    location: "Dhaka, Bangladesh",
    status: "approved",
    scopes: ["openid", "uniqueness.promo"],
  },
  {
    id: "log_2",
    who: "Probashi Bank",
    logo: "P",
    what: "e-KYC Account Opening Verification (LOA3)",
    when: "3 hours ago",
    location: "Dhaka, Bangladesh",
    status: "approved",
    scopes: ["openid", "profile.name", "kyc.level"],
  },
  {
    id: "log_3",
    who: "Bazar Local",
    logo: "B",
    what: "Duplicate promo attempt rejected (already redeemed)",
    when: "1 day ago",
    location: "Chittagong, Bangladesh",
    status: "blocked",
    scopes: ["uniqueness.promo"],
  },
  {
    id: "log_4",
    who: "TakaPay MFS",
    logo: "T",
    what: "SIM binding verification challenge",
    when: "3 days ago",
    location: "Dhaka, Bangladesh",
    status: "approved",
    scopes: ["openid", "contact.phone_verified"],
  },
  {
    id: "log_5",
    who: "Foreign Identity Verifier",
    logo: "F",
    what: "Cross-border proof of nationality request",
    when: "1 week ago",
    location: "Singapore",
    status: "revoked",
    scopes: ["nationality.bd"],
  },
];

export default function Activity() {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const filteredLogs = INITIAL_LOGS.filter((l) => {
    const matchesQuery =
      l.who.toLowerCase().includes(query.toLowerCase()) ||
      l.what.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filterStatus === "all" || l.status === filterStatus;
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Activity &amp; Privacy Center
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary">
              Immutable Log
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Complete transparency into every access event. Verify what was shared and audit minimal data storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => alert("Downloading encrypted audit bundle JSON...")}>
            <Download className="mr-1.5 h-4 w-4" />
            <span>Export Audit Log</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by partner name or activity..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-xl">
          {["all", "approved", "blocked", "revoked"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filterStatus === status
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Section */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Audit Timeline</CardTitle>
          <CardDescription className="text-xs">
            Cryptographically timestamped log of authorization and verification events.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-sm text-primary border border-border flex-shrink-0 mt-0.5">
                    {log.logo}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{log.who}</span>
                      <Badge
                        variant={
                          log.status === "approved"
                            ? "success"
                            : log.status === "blocked"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-[10px] capitalize"
                      >
                        {log.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">• {log.location}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{log.what}</p>
                    <div className="flex items-center gap-1 pt-1">
                      {log.scopes.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-secondary/80 border border-border/50 text-[10px] font-mono text-muted-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 self-end sm:self-center font-mono text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {log.when}
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No log entries matched your search criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* "Data We Hold" Privacy Center */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Data We Hold — Proof of Minimal Storage</CardTitle>
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <CardDescription className="text-xs">
            AmarID enforces strict data minimization. We store zero raw personal identifiers or biometric images.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3.5 rounded-xl border border-border bg-secondary/30 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Raw Biometrics (Face, Iris, Fingerprints)</div>
              <div className="text-xs text-muted-foreground">Photos and scanner images are processed ephemerally on-device.</div>
            </div>
            <span className="text-xs font-mono font-bold text-destructive px-2 py-1 rounded bg-destructive/10">
              NOT STORED (0 Bytes)
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-secondary/30 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">National ID (NID) / Passport Number</div>
              <div className="text-xs text-muted-foreground">Used once to verify with EC database, never persisted in plain text.</div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 px-2 py-1 rounded bg-amber-500/10">
              Salted SHA-256 Hash Only
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-secondary/30 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Device Biometric Passkeys (FIDO2 / WebAuthn)</div>
              <div className="text-xs text-muted-foreground">Private keys never leave your secure enclave.</div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 px-2 py-1 rounded bg-emerald-500/10">
              Public Key Only
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-secondary/30 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Mobile Phone &amp; Email Contact</div>
              <div className="text-xs text-muted-foreground">Encrypted with citizen-bound key for security alerts.</div>
            </div>
            <span className="text-xs font-mono font-bold text-foreground px-2 py-1 rounded bg-secondary">
              AES-256-GCM Encrypted
            </span>
          </div>

          {/* Account Governance */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={() => alert("Downloading your encrypted personal data archive...")}>
              <Download className="mr-2 h-4 w-4" />
              <span>Download My Archive (JSON)</span>
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete My Universal ID</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full border border-destructive/40 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-8 h-8 flex-shrink-0" />
              <div>
                <CardTitle className="text-lg text-destructive">Delete Universal ID?</CardTitle>
                <div className="text-xs text-muted-foreground">Irreversible sovereign identity revocation</div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Deleting your Universal ID will permanently invalidate your credentials across all linked banks, government portals, and services. Your biometric deduplication hash will be placed into a tombstone state.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  alert("Identity deletion request signed and submitted.");
                  setDeleteModalOpen(false);
                }}
              >
                Confirm Permanent Deletion
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
