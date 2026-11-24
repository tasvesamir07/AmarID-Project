"use client";

import { Fingerprint } from "lucide-react";
import { useState, type FormEvent } from "react";
import { CodeStep } from "@/components/code-step";
import { FaceCheck } from "@/components/face-check";
import { Button, Field, Input, Notice } from "@/components/ui";
import { ApiError, call } from "@/lib/api-client";
import { useErrorText, useT } from "@/lib/i18n/client";
import { createPasskey } from "@/lib/passkey-client";
import { normalizeUniversalId } from "@/lib/universal-id";
import { normalizeMsisdn } from "@/lib/validation";

type Step = "identify" | "code" | "face" | "passkey";

export function RecoverFlow({ next, sandbox }: { next: string; sandbox: boolean }) {
  const t = useT();
  const errorText = useErrorText();
  const [step, setStep] = useState<Step>("identify");
  const [universalId, setUniversalId] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const idInvalid = !normalizeUniversalId(universalId);
  const phoneInvalid = !normalizeMsisdn(phone);

  async function identify(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (idInvalid || phoneInvalid) return;
    setBusy(true);
    try {
      await call("POST", "/api/auth/recover", { universalId, phone });
      setStep("code");
    } catch (err) {
      setError(err instanceof ApiError ? err.code : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  async function addPasskey() {
    setBusy(true);
    setError(null);
    try {
      await createPasskey("/api/me/passkeys");
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.code : "UNKNOWN");
      setBusy(false);
    }
  }

  if (step === "identify") {
    return (
      <form onSubmit={identify} noValidate className="animate-rise space-y-6">
        <Header title={t.recover.title} body={t.recover.body} />
        {error && <Notice tone="error" title={errorText(error)} />}
        <Field label={t.recover.universalId} htmlFor="uid" hint={t.recover.universalIdHint} error={touched && idInvalid ? t.errors.UNIVERSAL_ID_INVALID : undefined}>
          <Input id="uid" value={universalId} onChange={(e) => setUniversalId(e.target.value.toUpperCase())} placeholder="AID-XXXX-XXXX-XXXX" autoComplete="username" autoCapitalize="characters" spellCheck={false} invalid={touched && idInvalid} className="font-mono tracking-wide" />
        </Field>
        <Field label={t.recover.phone} htmlFor="phone" error={touched && phoneInvalid ? t.errors.PHONE_INVALID : undefined}>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-3 tabular" aria-hidden>+880</span>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel-national" placeholder="1XXX-XXXXXX" invalid={touched && phoneInvalid} className="pl-16 tabular" />
          </div>
        </Field>
        <Button type="submit" block size="lg" loading={busy}>{t.recover.sendCode}</Button>
      </form>
    );
  }

  if (step === "code") {
    return (
      <section className="animate-rise space-y-6">
        <Header title={t.recover.codeTitle} />
        {/* Deliberately the same message whether or not the ID and number belong together. */}
        <Notice tone="info">{t.recover.codeNote}</Notice>
        <CodeStep
          sandbox={sandbox}
          onVerify={async (code) => {
            await call("PUT", "/api/auth/recover", { code });
            setStep("face");
          }}
          footer={
            <button type="button" onClick={() => setStep("identify")} className="text-ink-3 underline-offset-4 hover:text-ink hover:underline">
              {t.recover.startOver}
            </button>
          }
        />
      </section>
    );
  }

  if (step === "face") {
    return (
      <section className="animate-rise space-y-6">
        <Header title={t.recover.faceTitle} body={t.recover.faceBody} />
        <FaceCheck
          endpoint="/api/auth/recover/liveness"
          onPassed={() => setStep("passkey")}
          onRejected={(code) => {
            if (code !== "RECOVERY_EXPIRED") return false;
            setError(code);
            setStep("identify");
            return true;
          }}
        />
      </section>
    );
  }

  return (
    <section className="animate-rise space-y-6">
      <Header title={t.recover.doneTitle} body={t.recover.doneBody} />
      {error && error !== "PASSKEY_CANCELLED" && <Notice tone="error" title={errorText(error)} />}
      <Button block size="lg" loading={busy} onClick={addPasskey}>
        <Fingerprint className="size-5" aria-hidden />
        {t.recover.addPasskey}
      </Button>
      <Button block variant="ghost" onClick={() => window.location.assign(next)}>{t.recover.skip}</Button>
    </section>
  );
}

function Header({ title, body }: { title: string; body?: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold sm:text-[1.7rem]">{title}</h1>
      {body && <p className="text-ink-2">{body}</p>}
    </div>
  );
}
