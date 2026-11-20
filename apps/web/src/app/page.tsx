"use client";

import { useState } from "react";
import {
  ArrowRight,
  Shield,
  Fingerprint,
  Smartphone,
  Lock,
  CheckCircle2,
  Sparkles,
  QrCode,
  ExternalLink,
  Layers,
  KeyRound,
  FileCheck2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IdCard } from "@/components/id-card";

const CONTENT = {
  en: {
    badge: "Sovereign Digital Identity Architecture",
    title: "One person. One Universal ID. Made for Bangladesh.",
    subtitle:
      "A privacy-first, biometric-backed digital identity that replaces risky document photocopies, unprotected NID sharing, and foreign logins.",
    cta: "Get your Universal ID",
    alt: "Sign in with Passkey",
    demoCta: "Test Bazar Local Demo",
    cardsTitle: "Engineered for uncompromising citizen sovereignty",
    cardsSubtitle: "Zero raw biometrics stored. Strict zero-knowledge deduplication.",
    cards: [
      {
        icon: Shield,
        tag: "Zero Raw Storage",
        t: "Private by design",
        d: "We never store raw biometrics, NID numbers, or passport copies. Only salted one-way hashes and encrypted client-bound keys stay on your device.",
      },
      {
        icon: Fingerprint,
        tag: "Biometric Dedup",
        t: "One person, one ID",
        d: "Advanced multi-modal biometric deduplication ensures a single living citizen can only ever generate one Universal ID. No duplicates. No ghost voters.",
      },
      {
        icon: Smartphone,
        tag: "National OIDC SSO",
        t: "Local Sovereign SSO",
        d: "“Continue with Universal ID” provides Bangladesh's own OpenID Connect 2.0 login for banks, telcos, and e-commerce with granular consent.",
      },
    ],
    cardDemoNote: "Interactive card: Move mouse to tilt, tap to reveal or show verification QR",
    trustMetrics: [
      { label: "Raw Biometrics Kept", value: "0 Bytes" },
      { label: "Assurance Level", value: "LOA3" },
      { label: "Verification Latency", value: "< 1.8s" },
      { label: "Consent Model", value: "Granular" },
    ],
  },
  bn: {
    badge: "সার্বভৌম ডিজিটাল পরিচয় ব্যবস্থা",
    title: "একজন মানুষ। একটি ইউনিভার্সাল আইডি। বাংলাদেশের জন্য তৈরি।",
    subtitle:
      "গোপনীয়তা-প্রথম, বায়োমেট্রিক-সমর্থিত ডিজিটাল পরিচয় যা ঝুঁকিপূর্ণ নথিপত্রের ফটোকপি এবং অনিরাপদ শেয়ারিং প্রতিস্থাপন করে।",
    cta: "আপনার ইউনিভার্সাল আইডি পান",
    alt: "পাসকি দিয়ে সাইন ইন করুন",
    demoCta: "বাজার লোকাল ডেমো পরীক্ষা করুন",
    cardsTitle: "নাগরিকের তথ্যের পূর্ণ সুরক্ষায় নির্মিত",
    cardsSubtitle: "কোনো কাঁচা বায়োমেট্রিক্স সংরক্ষণ করা হয় না। জিরো-নলেজ যাচাইকরণ।",
    cards: [
      {
        icon: Shield,
        tag: "জিরো র স্টোরেজ",
        t: "ডিজাইনেই গোপনীয়তা",
        d: "আমরা কখনোই কাঁচা আঙুলের ছাপ, ফেস ছবি বা এনআইডি সংরক্ষণ করি না। শুধুমাত্র এনক্রিপ্ট করা হ্যাশ আপনার ডিভাইসে সুরক্ষিত থাকে।",
      },
      {
        icon: Fingerprint,
        tag: "বায়োমেট্রিক ডিডুপ",
        t: "একজন মানুষ, একটি আইডি",
        d: "উন্নত বায়োমেট্রিক ডিডুপ্লিকেশনের মাধ্যমে নিশ্চিত করা হয় একজন নাগরিক কেবল একটিই বৈধ ডিজিটাল পরিচয় তৈরি করতে পারবেন।",
      },
      {
        icon: Smartphone,
        tag: "সার্বভৌম SSO",
        t: "স্থানীয় ওআইডিসি লগইন",
        d: "“আমার আইডি দিয়ে চালিয়ে যান” — স্থানীয় ব্যাংক, টেলকো ও অ্যাপের জন্য বাংলাদেশের নিজস্ব সার্বভৌম লগইন পদ্ধতি।",
      },
    ],
    cardDemoNote: "কার্ডটি টিল্ট করতে মাউস নাড়ান, আইডি দেখতে বা কিউআর কোড দেখাতে ট্যাপ করুন",
    trustMetrics: [
      { label: "সংরক্ষিত কাঁচা বায়োমেট্রিক", value: "০ বাইট" },
      { label: "নিশ্চয়তার মাত্রা", value: "LOA3" },
      { label: "যাচাইকরণের গতি", value: "< ১.৮ সে." },
      { label: "সম্মতি মডেল", value: "দানাদার" },
    ],
  },
};

export default function Home() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const t = CONTENT[lang];

  return (
    <div className={`min-h-screen flex flex-col ${lang === "bn" ? "font-bengali" : ""}`}>
      {/* Hero Section */}
      <section className="relative px-4 pt-12 pb-16 lg:pt-20 lg:pb-28 overflow-hidden">
        {/* Subtle decorative mesh gradient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[250px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          {/* Language Toggle Pill */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center p-1 rounded-full border border-border bg-card shadow-sm">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  lang === "en"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang("bn")}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  lang === "bn"
                    ? "bg-primary text-primary-foreground shadow-sm font-bengali"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.badge}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-foreground">
                {lang === "en" ? (
                  <>
                    One person. <br />
                    <span className="text-primary">One Universal ID.</span> <br />
                    Made for Bangladesh.
                  </>
                ) : (
                  t.title
                )}
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {t.subtitle}
              </p>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center lg:justify-start">
                <Button asChild size="lg" className="w-full sm:w-auto shadow-md">
                  <Link href="/onboarding" className="flex items-center gap-2 font-semibold">
                    <span>{t.cta}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/login">{t.alt}</Link>
                </Button>
              </div>

              {/* Trust Micro-copy */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>Zero raw data stored</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span>NID &amp; SIM verified</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span>LOA3 Assurance</span>
                </span>
              </div>
            </div>

            {/* Right Hero: Signature Interactive Universal ID Card */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-sm">
                <IdCard
                  name="Md. Arifur Rahman"
                  maskedId="AID-7K4M-••••-92QX"
                  unmaskedId="AID-7K4M-8391-92QX"
                  badges={[
                    { label: "NID", verified: true },
                    { label: "SIM", verified: true },
                    { label: "Face", verified: true },
                    { label: "Fingerprint", verified: true },
                  ]}
                  nextProofOfLifeInDays={62}
                  status="ACTIVE"
                  showQrToggle={true}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                <span>{t.cardDemoNote}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Metrics Bar */}
      <section className="border-y border-border bg-card/60 py-8 px-4 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {t.trustMetrics.map((m, i) => (
            <div key={i} className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                {m.value}
              </div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Core Value Prop Cards Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {t.cardsTitle}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              {t.cardsSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {t.cards.map((c, i) => {
              const Icon = c.icon;
              return (
                <Card
                  key={i}
                  className="group relative overflow-hidden border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-sm">
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary" className="text-[11px] font-mono">
                        {c.tag}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold">{c.t}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {c.d}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture & Flow Spotlight */}
      <section className="py-16 px-4 bg-secondary/40 border-t border-border">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <Badge variant="outline" className="border-primary/30 text-primary">
              Standard Compliance
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Replaces document scanning with cryptographic zero-knowledge proofs
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              When a bank or service asks for proof of age or identity, AmarID sends a verified token:
              "Citizen is over 18 ✓" — without ever revealing date of birth, home address, or national ID number.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Device-Bound Passkeys</div>
                  <div className="text-xs text-muted-foreground">FIDO2 / WebAuthn standard prevents phishing and credential theft.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">One-Tap Consent Revocation</div>
                  <div className="text-xs text-muted-foreground">Instantly revoke any partner application’s access right from your dashboard.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Local Sovereign Infrastructure</div>
                  <div className="text-xs text-muted-foreground">Self-hosted Bangladesh infrastructure, free from foreign cloud dependency.</div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button asChild variant="outline">
                <Link href="/consent" className="flex items-center gap-2">
                  <span>View Sample Consent Screen</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Partner Demo Box */}
          <Card className="border border-border/80 shadow-md bg-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  B
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Bazar Local Demo RP</div>
                  <div className="text-xs text-muted-foreground">Simulated E-Commerce Relying Party</div>
                </div>
              </div>
              <Badge variant="success">Sandbox Live</Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              Experience how partner apps integrate with AmarID. Bazar Local offers a "One person, one promo" coupon verified in real time.
            </p>

            <div className="p-4 rounded-xl bg-secondary/50 border border-border/60 space-y-2">
              <div className="text-xs font-semibold text-foreground">Requested Permissions:</div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-card border border-border font-mono">openid</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-card border border-border font-mono">profile.name</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-card border border-border font-mono">uniqueness.promo</span>
              </div>
            </div>

            <Button asChild className="w-full">
              <Link href="/bazar" className="flex items-center justify-center gap-2">
                <span>Open Bazar Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white font-bold text-[10px]">
              AI
            </div>
            <span className="font-semibold text-foreground">AmarID</span>
            <span>— Sovereign Identity Architecture for Bangladesh</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/activity" className="hover:text-foreground transition-colors">Privacy Center</Link>
            <Link href="/admin" className="hover:text-foreground transition-colors">Auditor Portal</Link>
            <Link href="/proof-of-life" className="hover:text-foreground transition-colors">Proof of Life</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
