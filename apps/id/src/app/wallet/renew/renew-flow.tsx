"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { FaceCheck } from "@/components/face-check";
import { Button } from "@/components/ui";
import { fmt, formatDate } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

export function RenewFlow({ next }: { next: string }) {
  const t = useT();
  const locale = useLocale();
  const [dueAt, setDueAt] = useState<string | null>(null);

  if (dueAt) {
    return (
      <section className="animate-rise space-y-6 pt-6 text-center">
        <CheckCircle2 className="mx-auto size-16 animate-pop text-brand" aria-hidden />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{t.renew.doneTitle}</h1>
          <p className="text-ink-2">{fmt(t.renew.doneBody, { date: formatDate(dueAt, locale) })}</p>
        </div>
        <Button size="lg" block onClick={() => window.location.assign(next)}>{t.common.continue}</Button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.renew.title}</h1>
        <p className="text-ink-2">{t.renew.body}</p>
      </div>
      <FaceCheck endpoint="/api/me/liveness" onPassed={(r) => setDueAt(String(r.livenessDueAt))} />
    </section>
  );
}
