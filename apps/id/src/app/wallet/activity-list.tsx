import { AppWindow, Ban, Fingerprint, KeyRound, LogIn, LogOut, RefreshCw, ScanFace, Sparkles, Ticket, Wrench, type LucideIcon } from "lucide-react";
import { fmt, formatDateTime, type Dictionary, type Locale } from "@/lib/i18n";
import type { WalletData } from "@/server/me";

const icons: Record<string, LucideIcon> = {
  "identity.issued": Sparkles,
  "identity.status_changed": RefreshCw,
  "auth.signed_in": LogIn,
  "auth.signed_out": LogOut,
  "auth.recovered": ScanFace,
  "passkey.added": Fingerprint,
  "passkey.revoked": KeyRound,
  "consent.granted": AppWindow,
  "consent.revoked": Ban,
  "partner.signed_in": AppWindow,
  "pass.created": Ticket,
  "pass.checked": Ticket,
  "pass.revoked": Ban,
  "liveness.renewed": ScanFace,
  "sandbox.action": Wrench,
};

function sentence(event: WalletData["activity"][number], t: Dictionary): string {
  const types = t.activity.types as Record<string, string>;
  const template = types[event.type] ?? event.type;
  const detail = event.detail;
  let extra = "";
  if (event.type === "identity.status_changed" && typeof detail.to === "string") {
    extra = (t.status as Record<string, string>)[detail.to] ?? detail.to;
  }
  if (event.type === "auth.signed_in" && Array.isArray(detail.amr)) {
    extra = detail.amr.includes("hwk") ? t.activity.withPasskey : t.activity.withSimFace;
  }
  if (event.type === "sandbox.action") extra = typeof detail.days === "number" ? fmt(t.activity.fastForward, { days: detail.days }) : String(detail.action ?? "");
  return fmt(template, { partner: event.partner ?? "", extra });
}

/** The person's own activity log, newest first. */
export function ActivityList({ events, t, locale }: { events: WalletData["activity"]; t: Dictionary; locale: Locale }) {
  if (events.length === 0) return <p className="py-6 text-center text-sm text-ink-3">{t.activity.empty}</p>;
  return (
    <ol className="divide-y divide-line">
      {events.map((event) => {
        const Icon = icons[event.type] ?? RefreshCw;
        const scopes = Array.isArray(event.detail.scopes) ? (event.detail.scopes as string[]) : [];
        return (
          <li key={event.id} className="flex items-start gap-3.5 py-3.5">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-sunken text-ink-2">
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-ink">{sentence(event, t)}</p>
              {scopes.length > 0 && event.type !== "auth.signed_in" && (
                <p className="mt-0.5 text-sm text-ink-3">{scopes.map((s) => (t.scopes as Record<string, { label: string }>)[s]?.label ?? s).join(" · ")}</p>
              )}
            </div>
            <time dateTime={event.at} className="shrink-0 pt-0.5 text-xs text-ink-3 tabular">
              {formatDateTime(event.at, locale)}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
