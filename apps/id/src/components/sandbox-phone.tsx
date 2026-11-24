"use client";

import { MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import { call } from "@/lib/api-client";
import { useT } from "@/lib/i18n/client";
import { formatMsisdn } from "@/lib/validation";

type Inbox = { to: string; messages: { id: string; body: string; at: string }[] } | null;

/**
 * Sandbox only. Stands in for the person's handset: it shows the SMS that the
 * simulated mobile network "delivered". The code is never part of an API
 * response to the form itself — it arrives here the way it would on a phone.
 */
export function SandboxPhone({ onCode }: { onCode?: (code: string) => void }) {
  const t = useT();
  const [inbox, setInbox] = useState<Inbox>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      call<{ inbox: Inbox }>("GET", "/api/sandbox/inbox")
        .then((r) => active && setInbox(r.inbox))
        .catch(() => {});
    load();
    const timer = setInterval(load, 2500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const message = inbox?.messages[0];
  const code = message ? /\b(\d{6})\b/.exec(message.body)?.[1] : undefined;

  return (
    <aside aria-label={t.sandbox.phoneTitle} className="rounded-2xl border border-dashed border-line-strong bg-sunken/70 p-4">
      <div className="flex items-center justify-between gap-3 text-xs text-ink-3">
        <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wide">
          <MessageSquareText className="size-3.5" aria-hidden />
          {t.sandbox.phoneTitle}
        </span>
        {inbox && <span className="font-mono tabular">{formatMsisdn(inbox.to)}</span>}
      </div>
      {message ? (
        <div className="mt-3 space-y-3">
          <p className="rounded-xl rounded-tl-sm bg-surface px-3.5 py-2.5 text-sm text-ink-2 shadow-sm ring-1 ring-line">{message.body}</p>
          {code && onCode && (
            <button type="button" onClick={() => onCode(code)} className="text-sm font-medium text-brand underline-offset-4 hover:underline">
              {t.sandbox.useCode}
            </button>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-3">{t.sandbox.phoneEmpty}</p>
      )}
      <p className="mt-3 text-xs text-ink-3">{t.sandbox.phoneNote}</p>
    </aside>
  );
}
