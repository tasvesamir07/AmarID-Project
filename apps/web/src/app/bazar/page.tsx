"use client";

import { useState } from "react";
import {
  ArrowRight,
  Shield,
  Tag,
  Users,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Star,
  Truck,
  Lock,
  ChevronRight,
  Fingerprint,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PRODUCTS = [
  {
    id: 1,
    name: "Jamdani Saree",
    price: "৳ 2,400",
    originalPrice: "৳ 4,800",
    rating: 4.8,
    reviews: 234,
    tag: "50% OFF",
    emoji: "🥻",
    seller: "Narsingdi Handloom",
  },
  {
    id: 2,
    name: "Hilsa Fish (1kg)",
    price: "৳ 650",
    originalPrice: "৳ 1,300",
    rating: 4.9,
    reviews: 512,
    tag: "50% OFF",
    emoji: "🐟",
    seller: "Padma Fresh",
  },
  {
    id: 3,
    name: "Mustard Oil (1L)",
    price: "৳ 160",
    originalPrice: "৳ 320",
    rating: 4.6,
    reviews: 89,
    tag: "50% OFF",
    emoji: "🫙",
    seller: "Faridpur Agro",
  },
  {
    id: 4,
    name: "Nakshi Kantha Quilt",
    price: "৳ 1,200",
    originalPrice: "৳ 2,400",
    rating: 4.7,
    reviews: 156,
    tag: "50% OFF",
    emoji: "🛏️",
    seller: "Rajshahi Crafts",
  },
];

type DemoStep = "browse" | "auth" | "consent" | "claimed" | "blocked";

export default function BazarPage() {
  const [step, setStep] = useState<DemoStep>("browse");
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [authAttempt, setAuthAttempt] = useState(0);

  const handleSignIn = () => {
    setAuthAttempt((n) => n + 1);
    setStep("auth");
    setTimeout(() => setStep("consent"), 1200);
  };

  const handleConsent = () => {
    if (authAttempt === 1) {
      setStep("claimed");
    } else {
      setStep("blocked");
    }
  };

  const handleReset = () => {
    setStep("browse");
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow">
              B
            </div>
            <div>
              <div className="font-bold text-foreground leading-none">Bazar Local</div>
              <div className="text-xs text-muted-foreground">Demo E-Commerce Partner</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-xs">
              Sandbox Live
            </Badge>
            <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
              AmarID Partner
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Promo Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-emerald-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white translate-x-20 -translate-y-20" />
          </div>
          <div className="relative">
            <Badge className="bg-white/20 text-white border-white/30 mb-3">
              🎉 BAZAR50 — Limited Promo
            </Badge>
            <h1 className="text-2xl font-bold mb-1">50% Off Your First Order</h1>
            <p className="text-white/80 text-sm max-w-md">
              One coupon per real person — enforced by AmarID biometric deduplication. No sock
              puppets. No duplicate accounts.
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Sybil-resistant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4" />
                <span>Biometric-verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>Privacy-first</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Product Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Featured Products
              </h2>
              <span className="text-xs text-muted-foreground">All 50% off with BAZAR50</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {PRODUCTS.map((p) => (
                <Card
                  key={p.id}
                  className={`cursor-pointer transition-all duration-200 border-2 ${
                    selectedProduct === p.id
                      ? "border-primary shadow-lg shadow-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                  onClick={() => setSelectedProduct(p.id)}
                >
                  <CardContent className="p-4">
                    <div className="text-4xl mb-3 text-center bg-secondary rounded-xl py-4">
                      {p.emoji}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-foreground text-sm">{p.name}</div>
                        <Badge className="text-[10px] bg-accent/10 text-accent border-accent/20 shrink-0">
                          {p.tag}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{p.seller}</div>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="font-medium text-foreground">{p.rating}</span>
                        <span className="text-muted-foreground">({p.reviews})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-primary">{p.price}</span>
                        <span className="text-xs text-muted-foreground line-through">
                          {p.originalPrice}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Auth / Demo Panel */}
          <div className="space-y-4">
            <Card className="border-border sticky top-32">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">
                  {step === "browse" && "Claim BAZAR50 Promo"}
                  {step === "auth" && "Verifying Identity…"}
                  {step === "consent" && "Grant Access to Bazar"}
                  {step === "claimed" && "Promo Claimed! ✓"}
                  {step === "blocked" && "Already Claimed"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* STEP: Browse */}
                {step === "browse" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      To claim your 50% coupon, sign in with your AmarID Universal ID. One person,
                      one claim — biometrically enforced.
                    </p>

                    <div className="rounded-xl bg-secondary/50 p-3 border border-border/60 space-y-2">
                      <div className="text-xs font-semibold text-foreground">
                        Bazar Local requests:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-card border border-border font-mono">
                          openid
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-card border border-border font-mono">
                          profile.name
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-card border border-border font-mono">
                          uniqueness.promo
                        </span>
                      </div>
                    </div>

                    <Button className="w-full gap-2" onClick={handleSignIn}>
                      <Shield className="w-4 h-4" />
                      Continue with Universal ID
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      No password. Biometric confirmation on your device.
                    </p>

                    {/* Demo second-attempt */}
                    {authAttempt > 0 && step === "browse" && (
                      <Button
                        variant="outline"
                        className="w-full gap-2 text-xs border-accent/40 text-accent hover:bg-accent/10"
                        onClick={handleSignIn}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Try again (simulate duplicate)
                      </Button>
                    )}
                  </div>
                )}

                {/* STEP: Auth spinner */}
                {step === "auth" && (
                  <div className="py-6 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <p className="text-xs text-muted-foreground">
                      Verifying with AmarID biometrics…
                    </p>
                    <p className="text-[11px] text-muted-foreground/60">
                      No biometric data leaves your device
                    </p>
                  </div>
                )}

                {/* STEP: Consent */}
                {step === "consent" && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                          B
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          Bazar Local
                        </span>
                        <Badge variant="success" className="text-[10px]">
                          Verified Partner
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Bazar Local wants to verify you are a unique real person to unlock the
                        BAZAR50 promo.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {[
                        { scope: "Your display name", allowed: true },
                        { scope: "Promo uniqueness proof", allowed: true },
                        { scope: "NID number or biometrics", allowed: false },
                        { scope: "Phone number", allowed: false },
                      ].map((s) => (
                        <div key={s.scope} className="flex items-center gap-2 text-xs">
                          {s.allowed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span
                            className={s.allowed ? "text-foreground" : "text-muted-foreground line-through"}
                          >
                            {s.scope}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button className="w-full gap-2" onClick={handleConsent}>
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Claim Coupon
                    </Button>
                    <button
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={handleReset}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* STEP: Claimed success */}
                {step === "claimed" && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-success/10 border border-success/30 p-4 text-center">
                      <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
                      <div className="font-bold text-foreground text-sm">Coupon Claimed!</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        BAZAR50 — 50% off applied to your cart
                      </div>
                    </div>

                    <div className="rounded-xl bg-secondary/50 p-3 border border-border space-y-1">
                      <div className="text-xs font-semibold text-foreground">
                        What AmarID shared:
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                        Display name only (not NID)
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                        Uniqueness proof (not biometrics)
                      </div>
                    </div>

                    <div className="rounded-xl bg-card border border-border p-3 space-y-1">
                      <div className="font-mono text-xs font-bold text-foreground text-center">
                        BAZAR50
                      </div>
                      <div className="text-[11px] text-muted-foreground text-center">
                        Valid for 24 hours · Single use
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 text-xs gap-1" onClick={handleReset}>
                        <ChevronRight className="w-3 h-3" />
                        Try duplicate
                      </Button>
                      <Button asChild className="flex-1 text-xs gap-1">
                        <Link href="/dashboard">
                          Dashboard
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP: Blocked (duplicate) */}
                {step === "blocked" && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-center">
                      <XCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
                      <div className="font-bold text-foreground text-sm">Promo Abuse Blocked</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        This Universal ID already claimed BAZAR50
                      </div>
                    </div>

                    <div className="rounded-xl bg-secondary/50 p-3 border border-border space-y-1 text-xs text-muted-foreground">
                      <p>
                        Even with a different phone number, AmarID&apos;s biometric deduplication
                        recognises you as the same person — so the second claim is blocked.
                      </p>
                      <p className="text-[11px] mt-1 text-muted-foreground/70">
                        No biometric data was shared with Bazar Local.
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full gap-2 text-xs"
                      onClick={handleReset}
                    >
                      Start over
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How it works */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  How AmarID protects Bazar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    icon: Fingerprint,
                    title: "Biometric dedup",
                    desc: "One real person = one Universal ID, forever",
                  },
                  {
                    icon: Lock,
                    title: "Zero data leak",
                    desc: "Bazar never sees NID, biometrics or phone",
                  },
                  {
                    icon: Shield,
                    title: "Granular consent",
                    desc: "You choose exactly what to share",
                  },
                  {
                    icon: Truck,
                    title: "Instant verify",
                    desc: "< 1.8s — faster than OTP",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Sybil demo note */}
            <Card className="border-border bg-card">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">Sybil resistance demo</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Claim the coupon once, then hit &quot;Try duplicate&quot; to see the second
                  attempt get blocked — even with a different phone or email.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
