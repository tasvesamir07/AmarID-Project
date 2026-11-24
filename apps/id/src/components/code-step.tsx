"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api-client";
import { fmt } from "@/lib/i18n";
import { useErrorText, useT } from "@/lib/i18n/client";
import { SandboxPhone } from "./sandbox-phone";
import { Button, Field, Input, Notice } from "./ui";

const RESEND_AFTER_SECONDS = 30;

/** One-time code entry, shared by enrollment and recovery. */
export function CodeStep({ phone, sandbox, onVerify, onResend, footer }: {
  /** Masked number the code was sent to, when it is safe to show. */
  phone?: string | null;
  sandbox: boolean;
  onVerify: (code: string) => Promise<void>;
  onResend?: () => Promise<void>;
  footer?: React.ReactNode;
}) {
  const t = useT();
  const errorText = useErrorText();
  const input = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(RESEND_AFTER_SECONDS);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    input.current?.focus();
  }, []);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function submit(value: string) {
    if (!/^\d{6}$/.test(value) || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onVerify(value);
    } catch (e) {
      const apiError = e instanceof ApiError ? e : null;
      const left = apiError?.extra.attemptsLeft;
      setError(apiError?.code === "OTP_INCORRECT" && typeof left === "number" ? fmt(t.code.wrongWithLeft, { n: left }) : errorText(apiError?.code));
      setCode("");
      input.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!onResend) return;
    setError(null);
    try {
      await onResend();
      setResent(true);
      setWait(RESEND_AFTER_SECONDS);
    } catch (e) {
      setError(errorText(e instanceof ApiError ? e.code : undefined));
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit(code);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <p className="text-ink-2">{phone ? fmt(t.code.sentTo, { phone }) : t.code.sentGeneric}</p>
      <Field label={t.code.label} htmlFor="otp" error={error}>
        <Input
          ref={input}
          id="otp"
          name="otp"
          value={code}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(next);
            if (next.length === 6) void submit(next);
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          invalid={!!error}
          aria-describedby={error ? "otp-error" : undefined}
          className="text-center font-mono text-2xl tracking-[0.5em] tabular"
          placeholder="••••••"
        />
      </Field>
      {resent && !error && <Notice tone="success" title={t.code.resent} />}
      <Button type="submit" block size="lg" loading={busy} disabled={code.length !== 6}>
        {t.code.verify}
      </Button>
      <div className="flex items-center justify-between text-sm">
        {onResend ? (
          <button type="button" onClick={resend} disabled={wait > 0} className="font-medium text-brand underline-offset-4 hover:underline disabled:text-ink-3 disabled:no-underline">
            {wait > 0 ? fmt(t.code.resendIn, { s: wait }) : t.code.resend}
          </button>
        ) : (
          <span />
        )}
        {footer}
      </div>
      {sandbox && <SandboxPhone onCode={(c) => { setCode(c); void submit(c); }} />}
    </form>
  );
}
