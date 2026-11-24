"use client";

import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button, Card, Notice, Spinner } from "@/components/ui";
import { fmt, formatDateTime } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";
import { isPassClaim, type PassClaim } from "@/lib/pass-claims";

type Check =
  | { valid: true; issuer: string; label: string; facts: Partial<Record<PassClaim, boolean | string>>; issuedAt: string; expiresAt: string }
  | { valid: false; reason: string };

/** Accepts a bare token or a full share link. */
const extractToken = (input: string) => input.trim().split("#").pop()!.trim();

export function Verifier() {
  const t = useT();
  const locale = useLocale();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Check | null>(null);
  const [failed, setFailed] = useState(false);

  const check = useCallback(async (token: string) => {
    if (!token) return;
    setBusy(true);
    setFailed(false);
    setResult(null);
    try {
      const res = await fetch("/api/passes/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      if (!res.ok) throw new Error();
      setResult((await res.json()) as Check);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, []);

  // A share link carries the token after "#", which browsers never send to a
  // server or put in a Referer header. Take it and clear it from the address bar.
  useEffect(() => {
    const token = window.location.hash.slice(1);
    if (token) {
      history.replaceState(null, "", window.location.pathname);
      void check(token);
    }
  }, [check]);

  function submit(e: FormEvent) {
    e.preventDefault();
    void check(extractToken(input));
  }

  return (
    <div className="space-y-6">
      {busy && (
        <Card className="flex items-center justify-center gap-3 p-10 text-ink-2">
          <Spinner /> {t.verify.checking}
        </Card>
      )}

      {result?.valid && (
        <Card className="animate-rise overflow-hidden">
          <div className="flex items-center gap-3 bg-brand px-5 py-4 text-white">
            <CheckCircle2 className="size-7 shrink-0" aria-hidden />
            <div>
              <p className="text-lg font-semibold">{t.verify.validTitle}</p>
              <p className="text-sm text-white/80">{fmt(t.verify.validSub, { label: result.label })}</p>
            </div>
          </div>
          <ul className="divide-y divide-line">
            {Object.entries(result.facts).filter(([k]) => isPassClaim(k)).map(([claim, value]) => (
              <li key={claim} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <span className="text-ink-2">{t.passes.claims[claim as PassClaim].label}</span>
                <span className="font-semibold text-ink">{typeof value === "string" ? value : value ? t.common.yes : t.common.no}</span>
              </li>
            ))}
          </ul>
          <p className="flex gap-2 border-t border-line bg-sunken/60 px-5 py-3 text-xs text-ink-3">
            <ShieldCheck className="size-4 shrink-0" aria-hidden />
            {fmt(t.verify.validFoot, { issuer: new URL(result.issuer).host, date: formatDateTime(result.expiresAt, locale) })}
          </p>
        </Card>
      )}

      {result && !result.valid && (
        <Card className="animate-rise flex items-start gap-3 p-5">
          <XCircle className="mt-0.5 size-7 shrink-0 text-danger" aria-hidden />
          <div>
            <p className="text-lg font-semibold">{t.verify.invalidTitle}</p>
            <p className="text-ink-2">{(t.verify.reasons as Record<string, string>)[result.reason] ?? t.verify.reasons.MALFORMED}</p>
          </div>
        </Card>
      )}

      {failed && <Notice tone="error" title={t.errors.NETWORK} />}

      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="pass-token" className="block text-sm font-medium">{t.verify.pasteLabel}</label>
        <textarea
          id="pass-token"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          spellCheck={false}
          placeholder={t.verify.pastePlaceholder}
          className="w-full rounded-xl bg-surface p-3.5 font-mono text-sm text-ink ring-1 ring-inset ring-line-strong placeholder:font-sans placeholder:text-ink-3/70 focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <Button type="submit" loading={busy} disabled={!input.trim()}>{t.verify.check}</Button>
      </form>
    </div>
  );
}
