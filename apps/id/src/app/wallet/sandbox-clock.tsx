"use client";

import { FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { call } from "@/lib/api-client";
import { useT } from "@/lib/i18n/client";

/** Sandbox only: shows what a year of calendar time does to an identity, in one click. */
export function SandboxClock({ partnersUrl }: { partnersUrl: string }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);

  async function forward(days: number) {
    setBusy(days);
    await call("POST", "/api/me/sandbox", { days }).catch(() => {});
    router.refresh();
    setBusy(null);
  }

  return (
    <Card as="section" className="space-y-4 border-dashed p-5 shadow-none">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <FlaskConical className="size-4 text-warn" aria-hidden />
        {t.sandbox.toolsTitle}
      </div>
      <p className="text-sm text-ink-2">{t.sandbox.clockBody}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" loading={busy === 340} onClick={() => forward(340)}>{t.sandbox.clock11}</Button>
        <Button size="sm" variant="secondary" loading={busy === 400} onClick={() => forward(400)}>{t.sandbox.clock13}</Button>
      </div>
      <p className="text-sm text-ink-2">
        {t.sandbox.partnersBody}{" "}
        <a href={`${partnersUrl}/daraz`} className="font-medium text-brand underline-offset-4 hover:underline">Daraz (demo)</a>
        {" · "}
        <a href={`${partnersUrl}/bkash`} className="font-medium text-brand underline-offset-4 hover:underline">bKash (demo)</a>
        {" · "}
        <a href={`${partnersUrl}/abroad`} className="font-medium text-brand underline-offset-4 hover:underline">GlobalVerify</a>
      </p>
    </Card>
  );
}
