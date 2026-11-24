import { AppWindow, BadgeCheck } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { fmt, formatDate, formatRelative } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";
import { env } from "@/server/env";
import { walletData } from "@/server/me";
import { requireSession } from "@/server/session";
import { PageHeading } from "../page-heading";
import { RemoveButton } from "../remove-button";

export default async function AppsPage() {
  const { t, locale } = await getT();
  const data = await walletData(await requireSession());

  return (
    <div className="space-y-6">
      <PageHeading title={t.apps.title} body={t.apps.body} />
      {data.grants.length === 0 ? (
        <Card className="space-y-3 p-8 text-center">
          <AppWindow className="mx-auto size-8 text-ink-3" aria-hidden />
          <p className="font-medium">{t.apps.emptyTitle}</p>
          <p className="text-sm text-ink-3">{t.apps.emptyBody}</p>
          {env().sandbox && (
            <p className="text-sm">
              <a href={`${env().partnersUrl}/`} className="font-medium text-brand underline-offset-4 hover:underline">{t.apps.tryDemo}</a>
            </p>
          )}
        </Card>
      ) : (
        <ul className="space-y-4">
          {data.grants.map((g) => (
            <Card as="li" key={g.id} className="space-y-4 p-5">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sunken text-lg font-semibold text-brand-deep" aria-hidden>{g.name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 font-medium">
                    {g.name}
                    {g.verified && <BadgeCheck className="size-4 text-brand" aria-label={t.consent.verifiedPartner} />}
                  </p>
                  <p className="text-sm text-ink-3">
                    {g.category} · {fmt(t.apps.since, { date: formatDate(g.grantedAt, locale) })}
                    {g.lastUsedAt && <> · {fmt(t.apps.lastUsed, { when: formatRelative(g.lastUsedAt, locale) })}</>}
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">{t.apps.canSee}</p>
                <ul className="flex flex-wrap gap-2">
                  {g.scopes.map((s) => (
                    <li key={s}><Badge tone={s === "openid" || s === "age" ? "brand" : "neutral"}>{t.scopes[s].label}</Badge></li>
                  ))}
                </ul>
              </div>
              <RemoveButton endpoint={`/api/me/grants/${g.id}`} label={t.apps.remove} confirm={fmt(t.apps.removeConfirm, { partner: g.name })} />
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
