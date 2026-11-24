"use client";

import { Fingerprint, QrCode, ScanFace } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ApiError } from "@/lib/api-client";
import { useErrorText, useT } from "@/lib/i18n/client";
import { signInWithPasskey } from "@/lib/passkey-client";
import { Button, Notice } from "./ui";

export function SignInPanel({ next }: { next: string }) {
  const t = useT();
  const errorText = useErrorText();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      await signInWithPasskey();
      // A full navigation, so every server-rendered part sees the new session.
      window.location.assign(next);
    } catch (e) {
      setError(e instanceof ApiError ? e.code : "UNKNOWN");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && error !== "PASSKEY_CANCELLED" && <Notice tone="error" title={errorText(error)} />}
      {error === "PASSKEY_CANCELLED" && <Notice tone="warn" title={t.errors.PASSKEY_CANCELLED} />}

      <Button block size="lg" loading={busy} onClick={signIn}>
        <Fingerprint className="size-5" aria-hidden />
        {t.signIn.withPasskey}
      </Button>

      <ul className="space-y-3 rounded-2xl bg-sunken/70 p-4 text-sm text-ink-2">
        <li className="flex gap-3">
          <QrCode className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
          <span>{t.signIn.otherDevice}</span>
        </li>
        <li className="flex gap-3">
          <ScanFace className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
          <span>
            {t.signIn.noPasskey}{" "}
            <Link href={`/recover?next=${encodeURIComponent(next)}`} className="font-medium text-brand underline-offset-4 hover:underline">
              {t.signIn.useSimFace}
            </Link>
          </span>
        </li>
      </ul>
    </div>
  );
}
