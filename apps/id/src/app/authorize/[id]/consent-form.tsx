"use client";

import { clsx } from "clsx";
import { BadgeCheck, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { Button, Notice } from "@/components/ui";
import { ApiError, call } from "@/lib/api-client";
import { fmt } from "@/lib/i18n";
import { useErrorText, useT } from "@/lib/i18n/client";
import type { Scope } from "@/lib/scopes";

export type ConsentItem = { scope: Scope; required: boolean; granted: boolean; value: string };

export function ConsentForm({ requestId, partner, person, items, returning }: {
  requestId: string;
  partner: { name: string; category: string; host: string; verified: boolean };
  person: { name: string; maskedId: string };
  items: ConsentItem[];
  /** Everything requested was approved before: only a confirmation is needed. */
  returning: boolean;
}) {
  const t = useT();
  const errorText = useErrorText();
  const [chosen, setChosen] = useState<Set<Scope>>(() => new Set(items.map((i) => i.scope)));
  const [busy, setBusy] = useState<"allow" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(approve ? "allow" : "deny");
    setError(null);
    try {
      const { redirectTo } = await call<{ redirectTo: string }>("POST", `/api/authorize/${requestId}`, { approve, scopes: [...chosen] });
      window.location.assign(redirectTo);
    } catch (e) {
      setError(e instanceof ApiError ? e.code : "UNKNOWN");
      setBusy(null);
    }
  }

  function toggle(scope: Scope) {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  }

  return (
    <div className="animate-rise space-y-6">
      <div className="space-y-3 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface text-xl font-semibold text-brand-deep shadow-(--shadow-card) ring-1 ring-line" aria-hidden>
          {partner.name.slice(0, 1)}
        </span>
        <h1 className="text-2xl font-semibold">{fmt(returning ? t.consent.titleReturning : t.consent.title, { partner: partner.name })}</h1>
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-ink-3">
          <span>{partner.category}</span>
          <span aria-hidden>·</span>
          <span className="font-mono text-[13px]">{partner.host}</span>
          {partner.verified && (
            <span className="flex items-center gap-1 text-brand">
              <BadgeCheck className="size-4" aria-hidden />
              {t.consent.verifiedPartner}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-sunken/70 px-4 py-3 text-sm">
        <span className="text-ink-3">{t.consent.signedInAs}</span>
        <span className="text-right">
          <span className="font-medium text-ink">{person.name}</span>
          <span className="ml-2 font-mono text-[13px] text-ink-3">{person.maskedId}</span>
        </span>
      </div>

      <section aria-labelledby="share-heading" className="overflow-hidden rounded-2xl bg-surface shadow-(--shadow-card) ring-1 ring-line">
        <h2 id="share-heading" className="border-b border-line px-4 py-3 text-sm font-semibold">
          {fmt(t.consent.willReceive, { partner: partner.name })}
        </h2>
        <ul className="divide-y divide-line">
          {items.map((item) => {
            const on = chosen.has(item.scope);
            const info = t.scopes[item.scope];
            return (
              <li key={item.scope} className="flex items-start gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{info.label}</p>
                  <p className="text-sm text-ink-3">{info.why}</p>
                  <p className={clsx("mt-1.5 inline-block max-w-full break-words rounded-md px-2 py-0.5 text-sm", on ? "bg-brand-soft text-brand-strong" : "bg-sunken text-ink-3 line-through")}>{item.value}</p>
                </div>
                {item.required ? (
                  <span className="mt-0.5 flex shrink-0 items-center gap-1 text-xs text-ink-3">
                    <Lock className="size-3.5" aria-hidden />
                    {t.consent.required}
                  </span>
                ) : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={fmt(t.consent.shareToggle, { item: info.label })}
                    onClick={() => toggle(item.scope)}
                    className={clsx("relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-brand" : "bg-line-strong")}
                  >
                    <span className={clsx("absolute top-0.5 size-6 rounded-full bg-white shadow transition-[left]", on ? "left-[22px]" : "left-0.5")} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <p className="flex gap-2.5 text-sm text-ink-3">
        <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t.consent.neverShared}
      </p>

      {error && <Notice tone="error" title={errorText(error)} />}

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button size="lg" className="sm:flex-1" loading={busy === "allow"} disabled={busy !== null} onClick={() => decide(true)}>
          {returning ? t.consent.continue : t.consent.allow}
        </Button>
        <Button size="lg" variant="secondary" className="sm:flex-1" loading={busy === "deny"} disabled={busy !== null} onClick={() => decide(false)}>
          {t.consent.cancel}
        </Button>
      </div>
      <p className="text-center text-xs text-ink-3">{t.consent.revokeNote}</p>
    </div>
  );
}
