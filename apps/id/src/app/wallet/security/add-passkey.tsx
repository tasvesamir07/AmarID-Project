"use client";

import { Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Notice } from "@/components/ui";
import { errorCode } from "@/lib/api-client";
import { useErrorText, useT } from "@/lib/i18n/client";
import { createPasskey } from "@/lib/passkey-client";

export function AddPasskeyButton() {
  const t = useT();
  const errorText = useErrorText();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  async function add() {
    setBusy(true);
    setError(null);
    setAdded(false);
    try {
      await createPasskey("/api/me/passkeys");
      setAdded(true);
      router.refresh();
    } catch (e) {
      const code = errorCode(e);
      if (code !== "PASSKEY_CANCELLED") setError(code);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <Notice tone="error" title={errorText(error)} />}
      {added && <Notice tone="success" title={t.security.addedNotice} />}
      <Button variant="secondary" loading={busy} onClick={add}>
        <Fingerprint className="size-4" aria-hidden />
        {t.security.add}
      </Button>
    </div>
  );
}
