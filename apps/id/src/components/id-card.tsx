"use client";

import { clsx } from "clsx";
import { Check, Copy, Eye, EyeOff, Fingerprint, IdCard, ScanFace, Smartphone } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { maskUniversalId } from "@/lib/universal-id";

type Status = "ACTIVE" | "DORMANT" | "SUSPENDED" | "DECEASED";

/**
 * The identity card. The Universal ID is masked until the holder chooses to
 * show it — someone glancing at the screen should not be able to copy it.
 */
export function IdentityCard({ name, universalId, status = "ACTIVE", issued, interactive = true, className }: {
  name: string;
  universalId: string;
  status?: Status;
  issued?: string;
  interactive?: boolean;
  className?: string;
}) {
  const t = useT();
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const active = status === "ACTIVE";

  async function copy() {
    await navigator.clipboard.writeText(universalId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={clsx("card-pattern relative isolate aspect-[1.586] w-full max-w-md overflow-hidden rounded-[1.4rem] bg-brand-deep p-5 text-white shadow-(--shadow-lift) sm:p-6", !active && "grayscale-[0.6]", className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span lang="bn" className="relative grid size-8 place-items-center rounded-lg bg-white/12 text-base font-semibold ring-1 ring-white/20">
            আ<span className="absolute right-1 top-1 size-1.5 rounded-full bg-flag" />
          </span>
          <span className="text-sm font-medium tracking-wide text-white/80">{t.card.title}</span>
        </div>
        <span className={clsx("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", active ? "bg-white/12 text-white" : "bg-warn-soft text-warn")}>
          <span className={clsx("size-1.5 rounded-full", active ? "bg-[#4ade80]" : "bg-warn")} />
          {t.status[status]}
        </span>
      </div>

      <div className="absolute inset-x-5 bottom-5 space-y-3 sm:inset-x-6 sm:bottom-6">
        <div>
          <p className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{name}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <p className="font-mono text-[15px] tracking-[0.08em] text-white/90 tabular sm:text-base" aria-label={t.card.idLabel}>
              {shown ? universalId : maskUniversalId(universalId)}
            </p>
            {interactive && (
              <>
                <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? t.card.hide : t.card.show} className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
                  {shown ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
                <button type="button" onClick={copy} aria-label={t.card.copy} className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
                  {copied ? <Check className="size-4 text-[#4ade80]" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                </button>
                <span aria-live="polite" className="sr-only">{copied ? t.card.copied : ""}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-end justify-between border-t border-white/12 pt-3 text-xs text-white/70">
          <ul className="flex items-center gap-3" aria-label={t.card.verifiedBy}>
            <li className="flex items-center gap-1"><IdCard className="size-3.5" aria-hidden />{t.card.document}</li>
            <li className="flex items-center gap-1"><Smartphone className="size-3.5" aria-hidden />{t.card.sim}</li>
            <li className="flex items-center gap-1"><ScanFace className="size-3.5" aria-hidden />{t.card.face}</li>
            <li className="hidden items-center gap-1 min-[400px]:flex"><Fingerprint className="size-3.5" aria-hidden />{t.card.device}</li>
          </ul>
          {issued && <span className="shrink-0">{issued}</span>}
        </div>
      </div>
    </div>
  );
}
