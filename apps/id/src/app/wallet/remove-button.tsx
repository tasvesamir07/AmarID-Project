"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { call, errorCode } from "@/lib/api-client";
import { useErrorText, useT } from "@/lib/i18n/client";

/** A destructive action with an inline second step instead of a modal. */
export function RemoveButton({ endpoint, label, confirm }: { endpoint: string; label: string; confirm: string }) {
  const t = useT();
  const errorText = useErrorText();
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await call("DELETE", endpoint);
      router.refresh();
    } catch (e) {
      setError(errorText(errorCode(e)));
      setBusy(false);
    }
  }

  if (!asking) {
    return (
      <Button size="sm" variant="danger" onClick={() => setAsking(true)}>
        {label}
      </Button>
    );
  }
  return (
    <div className="space-y-3 rounded-xl bg-danger-soft/60 p-3.5" role="group" aria-label={label}>
      <p className="text-sm text-ink-2">{confirm}</p>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" variant="danger" loading={busy} onClick={remove}>{label}</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setAsking(false)}>{t.common.keep}</Button>
      </div>
    </div>
  );
}
