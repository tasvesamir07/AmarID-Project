"use client";

import { useState } from "react";
import { ArrowRight, Shield, Lock, Tag, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [claimed, setClaimed] = useState(false);
  const [blocked, setBlocked] = useState(false);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Bazar Local <span className="text-[#006A4E]">·</span> Demo store</h1>
        <p className="text-slate-600 mt-2">Local e-commerce partner using “Continue with Universal ID” — one person, one coupon.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-[#006A4E]" /><span className="font-semibold text-slate-900">Continue with Universal ID</span></div>
          <p className="text-sm text-slate-600 mb-4">Log in with your AmarID Universal ID instead of Google/Facebook. Biometric confirmation on your device.</p>
          <button className="w-full py-3 rounded-xl border border-[#006A4E] bg-[#006A4E] text-white font-semibold flex items-center justify-center gap-2" onClick={() => { window.location.href = "http://localhost:4000/authorize?client_id=bazar-local&redirect_uri=http://localhost:3001/callback&scope=openid%20profile.name%20uniqueness.promo&state=demo&nonce=demo&code_challenge=demo&code_challenge_method=S256&identityId=demo-identity"; }}>
            <ArrowRight className="h-4 w-4" /> Sign in with Universal ID
          </button>
          <p className="text-xs text-slate-500 mt-3">Demo: redirects to AmarID authorization.</p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-3"><Tag className="w-5 h-5 text-[#F42A41]" /><span className="font-semibold text-slate-900">Promo: BAZAR50</span></div>
          <p className="text-sm text-slate-600 mb-4">50% off your first order. Limited to one claim per real person (verified via Universal ID).</p>
          {claimed && (
            <div className="rounded-xl bg-green-50 p-4 border border-green-100"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-600" /></div><p className="text-sm text-green-800 mt-1">Coupon claimed successfully. One person, one coupon enforced.</p></div>
          )}
          {blocked && (
            <div className="rounded-xl bg-red-50 p-4 border border-red-100"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-600" /></div><p className="text-sm text-red-800 mt-1">Coupon already claimed for this identity. Promo abuse prevented.</p></div>
          )}
          {!claimed && !blocked && (
            <button className="w-full py-3 rounded-xl border border-[#F42A41] bg-[#F42A41]/10 text-[#F42A41] font-semibold flex items-center justify-center gap-2" onClick={() => setClaimed(true)}>
              <Tag className="h-4 w-4" /> Claim BAZAR50
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-center gap-3 mb-3"><Users className="w-5 h-5 text-slate-500" /><span className="font-semibold text-slate-900 text-sm">Sybil resistance demo</span></div>
        <p className="text-sm text-slate-600">Try signing up with two different phone numbers on AmarID — both resolve to the same Universal ID, so the second coupon claim is blocked.</p>
      </div>
    </div>
  );
}
