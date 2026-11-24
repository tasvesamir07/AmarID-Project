"use client";

import { clsx } from "clsx";
import { Check, Copy, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, Field, Input, Notice, Segmented } from "@/components/ui";
import { call, errorCode } from "@/lib/api-client";
import { useErrorText, useT } from "@/lib/i18n/client";
import { PASS_CLAIMS, PASS_DURATIONS, type PassClaim } from "@/lib/pass-claims";

const shareUrl = (token: string) => `${window.location.origin}/verify#${token}`;

/** The link, a copy button and a QR code for one pass. */
export function PassShare({ token }: { token: string }) {
  const t = useT();
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const url = shareUrl(token);

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 320, errorCorrectionLevel: "L", color: { dark: "#0f1a14", light: "#ffffff" } }).then(setQr).catch(() => setQr(null));
  }, [url]);

  async function copy() {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {qr && (
        // eslint-disable-next-line @next/next/no-img-element -- a data URL generated in the browser
        <img src={qr} alt={t.passes.qrAlt} className="size-36 shrink-0 self-center rounded-xl ring-1 ring-line" />
      )}
      <div className="min-w-0 flex-1 space-y-3">
        <p className="break-all rounded-lg bg-sunken px-3 py-2 font-mono text-xs text-ink-2">{url.slice(0, 96)}…</p>
        <Button size="sm" variant="secondary" onClick={copy}>
          {copied ? <Check className="size-4 text-brand" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? t.card.copied : t.passes.copyLink}
        </Button>
        <p className="text-sm text-ink-3">{t.passes.shareNote}</p>
      </div>
    </div>
  );
}

export function PassCreator() {
  const t = useT();
  const errorText = useErrorText();
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [claims, setClaims] = useState<Set<PassClaim>>(() => new Set(["real_person", "age_over_18"]));
  const [minutes, setMinutes] = useState<string>("60");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!label.trim() || claims.size === 0) return setError("INVALID_REQUEST");
    setBusy(true);
    setError(null);
    try {
      const created = await call<{ token: string }>("POST", "/api/me/passes", { label, claims: [...claims], minutes: Number(minutes) });
      setToken(created.token);
      setLabel("");
      router.refresh();
    } catch (err) {
      setError(errorCode(err));
    } finally {
      setBusy(false);
    }
  }

  function toggle(claim: PassClaim) {
    setClaims((prev) => {
      const next = new Set(prev);
      if (next.has(claim)) next.delete(claim);
      else next.add(claim);
      return next;
    });
  }

  if (token) {
    return (
      <Card className="animate-rise space-y-5 p-5">
        <Notice tone="success" title={t.passes.createdTitle}>{t.passes.createdBody}</Notice>
        <PassShare token={token} />
        <Button variant="ghost" size="sm" onClick={() => setToken(null)}>{t.passes.another}</Button>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-5 p-5" noValidate>
        <Field label={t.passes.forWhom} htmlFor="pass-label" hint={t.passes.forWhomHint}>
          <Input id="pass-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder={t.passes.forWhomPlaceholder} />
        </Field>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">{t.passes.whatToProve}</legend>
          {PASS_CLAIMS.map((claim) => {
            const on = claims.has(claim);
            return (
              <label key={claim} className={clsx("flex cursor-pointer items-start gap-3 rounded-xl p-3.5 ring-1 ring-inset transition-colors", on ? "bg-brand-soft/60 ring-brand/40" : "ring-line hover:bg-sunken/60")}>
                <input type="checkbox" checked={on} onChange={() => toggle(claim)} className="mt-1 size-4.5 shrink-0 accent-(--color-brand)" />
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{t.passes.claims[claim].label}</span>
                  <span className="block text-sm text-ink-3">{t.passes.claims[claim].hint}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t.passes.validFor}</p>
          <Segmented label={t.passes.validFor} value={minutes} onChange={setMinutes} options={PASS_DURATIONS.map((m) => ({ value: String(m), label: t.passes.durations[String(m) as keyof typeof t.passes.durations] }))} />
        </div>

        {error && <Notice tone="error" title={error === "INVALID_REQUEST" ? t.passes.incomplete : errorText(error)} />}
        <Button type="submit" loading={busy}>
          <Link2 className="size-4" aria-hidden />
          {t.passes.create}
        </Button>
      </form>
    </Card>
  );
}

/** Shows the link for an existing pass again. */
export function ShowPassButton({ passId }: { passId: string }) {
  const t = useT();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (token) return <PassShare token={token} />;
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        const result = await call<{ token: string }>("GET", `/api/me/passes/${passId}`).catch(() => null);
        setToken(result?.token ?? null);
        setBusy(false);
      }}
    >
      {t.passes.showLink}
    </Button>
  );
}
