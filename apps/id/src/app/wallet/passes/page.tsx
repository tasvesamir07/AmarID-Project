import { Badge, Card, Notice } from "@/components/ui";
import { fmt, formatDateTime, formatNumber, formatRelative } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";
import { walletData } from "@/server/me";
import { requireSession } from "@/server/session";
import { PageHeading } from "../page-heading";
import { RemoveButton } from "../remove-button";
import { PassCreator, ShowPassButton } from "./pass-tools";

export default async function PassesPage() {
  const { t, locale } = await getT();
  const auth = await requireSession();
  const data = await walletData(auth);
  const tone = { ACTIVE: "brand", EXPIRED: "neutral", REVOKED: "danger" } as const;

  return (
    <div className="space-y-8">
      <PageHeading title={t.passes.title} body={t.passes.body} />

      {auth.identity.status === "ACTIVE" ? <PassCreator /> : <Notice tone="warn" title={t.passes.inactive} />}

      {data.passes.length > 0 && (
        <section aria-labelledby="your-passes" className="space-y-3">
          <h2 id="your-passes" className="text-lg font-semibold">{t.passes.yours}</h2>
          <ul className="space-y-3">
            {data.passes.map((p) => (
              <Card as="li" key={p.id} className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{p.label}</p>
                    <p className="text-sm text-ink-3">
                      {formatDateTime(p.createdAt, locale)} ·{" "}
                      {p.state === "ACTIVE" ? fmt(t.passes.expires, { when: formatRelative(p.expiresAt, locale) }) : t.passes.states[p.state]} ·{" "}
                      {fmt(p.checks === 1 ? t.passes.checkedOnce : t.passes.checked, { n: formatNumber(p.checks, locale) })}
                    </p>
                  </div>
                  <Badge tone={tone[p.state]}>{t.passes.states[p.state]}</Badge>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {p.claims.map((c) => (
                    <li key={c}><Badge>{t.passes.claims[c].label}</Badge></li>
                  ))}
                </ul>
                {p.state === "ACTIVE" && (
                  <div className="flex flex-wrap items-start gap-3">
                    <ShowPassButton passId={p.id} />
                    <RemoveButton endpoint={`/api/me/passes/${p.id}`} label={t.passes.revoke} confirm={t.passes.revokeConfirm} />
                  </div>
                )}
              </Card>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
