"use client";

import { useState, useRef } from "react";
import { CheckCircle2, Shield, Lock, QrCode, Eye, EyeOff, Sparkles, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface IdCardProps {
  name?: string;
  maskedId: string;
  unmaskedId?: string;
  badges?: { label: string; verified: boolean }[];
  nextProofOfLifeInDays?: number | null;
  status?: string;
  onReveal?: () => void;
  showQrToggle?: boolean;
}

export function IdCard({
  name = "Md. Arifur Rahman",
  maskedId = "AID-7K4M-••••-92QX",
  unmaskedId = "AID-7K4M-8391-92QX",
  badges = [
    { label: "NID", verified: true },
    { label: "SIM", verified: true },
    { label: "Face", verified: true },
    { label: "Fingerprint", verified: true },
  ],
  nextProofOfLifeInDays = 62,
  status = "ACTIVE",
  onReveal,
  showQrToggle = true,
}: IdCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -(y * 10), y: x * 10 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const toggleReveal = () => {
    setRevealed(!revealed);
    if (onReveal) onReveal();
  };

  return (
    <div className="w-full max-w-md mx-auto perspective-1000">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.15s ease-out",
        }}
        className="relative overflow-hidden aspect-[1.586/1] w-full rounded-2xl holographic-card text-white shadow-2xl border border-white/20 select-none cursor-pointer group"
      >
        {/* Holographic light reflection sheen */}
        <div className="absolute inset-0 holographic-shimmer pointer-events-none opacity-60 group-hover:opacity-90 transition-opacity" />

        {/* Subtle guilloche background watermark */}
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Shield className="w-64 h-64 text-white" />
        </div>

        {/* Card Header */}
        <div className="relative z-10 p-5 md:p-6 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner">
              <Shield className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-wider uppercase drop-shadow-sm">AmarID</span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              </div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-emerald-200/90">
                Sovereign Digital Identity
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-xs font-medium text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              {status === "ACTIVE" ? "Active" : status}
            </div>
          </div>
        </div>

        {/* Smartchip & Contactless Wave */}
        <div className="relative z-10 px-5 md:px-6 flex items-center justify-between">
          <div className="w-11 h-8 rounded-md gold-chip border border-yellow-200/40 relative overflow-hidden flex items-center justify-center">
            <div className="w-full h-px bg-yellow-900/30 absolute top-2.5" />
            <div className="w-full h-px bg-yellow-900/30 absolute bottom-2.5" />
            <div className="h-full w-px bg-yellow-900/30 absolute left-3.5" />
            <div className="h-full w-px bg-yellow-900/30 absolute right-3.5" />
            <Sparkles className="w-3.5 h-3.5 text-yellow-900/40" />
          </div>

          {showQrToggle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowQr(!showQr);
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white/90 transition-all active:scale-95 flex items-center gap-1 text-xs"
              title="Show QR for in-person verification"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">QR Verify</span>
            </button>
          )}
        </div>

        {/* Card Body: ID and Citizen Name */}
        <div className="relative z-10 px-5 md:px-6 pt-3 pb-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-200/80">
              Universal Identifier
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleReveal();
              }}
              className="inline-flex items-center gap-1 text-[11px] text-emerald-200 hover:text-white transition-colors"
            >
              {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{revealed ? "Hide ID" : "Tap to reveal"}</span>
            </button>
          </div>

          <div className="font-mono text-lg md:text-xl font-bold tracking-widest text-white drop-shadow-md py-0.5">
            {revealed ? unmaskedId : maskedId}
          </div>

          <div className="text-sm font-semibold tracking-wide text-white/95 mt-0.5">
            {name}
          </div>
        </div>

        {/* Card Footer: Badges & Assurance */}
        <div className="relative z-10 px-5 md:px-6 pb-3 pt-1 flex items-end justify-between border-t border-white/10 mt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-sm border border-white/15 text-[10px] font-medium text-emerald-100"
                >
                  {b.label}
                  {b.verified && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300" />}
                </span>
              ))}
            </div>
            <div className="text-[9px] font-mono text-emerald-200/60 flex items-center gap-1 pt-0.5">
              <Lock className="w-2.5 h-2.5 text-emerald-300/80" /> Zero raw biometrics stored
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-[9px] font-mono text-emerald-200/80 uppercase tracking-wider">Proof-of-Life</div>
            <div className="text-xs font-mono font-bold text-white">
              {nextProofOfLifeInDays != null ? `In ${nextProofOfLifeInDays} days` : "Verified"}
            </div>
          </div>
        </div>

        {/* Rotating In-Person QR Overlay */}
        {showQr && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-30 p-4 flex flex-col items-center justify-center text-center animate-fadeIn"
          >
            <div className="w-28 h-28 bg-white p-2 rounded-xl shadow-lg flex items-center justify-center mb-2">
              <QrCode className="w-24 h-24 text-slate-900" />
            </div>
            <div className="text-xs font-semibold text-white flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" /> Time-Limited Verification QR
            </div>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[220px]">
              Rotates every 5 minutes. Never shares raw NID or biometrics.
            </p>
            <button
              onClick={() => setShowQr(false)}
              className="mt-2 text-xs text-emerald-300 underline underline-offset-2 hover:text-white"
            >
              Back to ID Card
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default IdCard;
