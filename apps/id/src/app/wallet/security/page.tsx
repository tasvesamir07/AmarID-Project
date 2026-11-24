import { Cloud, Fingerprint, ScanFace, Smartphone } from "lucide-react";
import Link from "next/link";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { fmt, formatDate, formatRelative } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";
import { walletData } from "@/server/me";
import { requireSession } from "@/server/session";
import { PageHeading } from "../page-heading";
import { RemoveButton } from "../remove-button";
import { AddPasskeyButton } from "./add-passkey";

export default async function SecurityPage() {
  const { t, locale } = await getT();
  const data = await walletData(await requireSession());
  const { profile } = data;

  return (
    <div className="space-y-8">
      <PageHeading title={t.security.title} body={t.security.body} />

      <section aria-labelledby="passkeys" className="space-y-3">
        <h2 id="passkeys" className="text-lg font-semibold">{t.security.passkeys}</h2>
        <Card className="divide-y divide-line">
          {data.passkeys.length === 0 && <p className="p-5 text-sm text-ink-3">{t.security.noPasskeys}</p>}
          {data.passkeys.map((p) => (
            <div key={p.id} className="space-y-3 p-5">
              <div className="flex items-start gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sunken text-ink-2"><Fingerprint className="size-5" aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {p.label}
                    {p.synced && <Badge tone="info"><Cloud className="size-3" aria-hidden />{t.security.synced}</Badge>}
                  </p>
                  <p className="text-sm text-ink-3">
                    {fmt(t.security.added, { date: formatDate(p.createdAt, locale) })}
                    {p.lastUsedAt && <> · {fmt(t.security.lastUsed, { when: formatRelative(p.lastUsedAt, locale) })}</>}
                  </p>
                </div>
              </div>
              <RemoveButton endpoint={`/api/me/passkeys/${p.id}`} label={t.security.remove} confirm={data.passkeys.length === 1 ? t.security.removeLastConfirm : t.security.removeConfirm} />
            </div>
          ))}
          <div className="p-5">
            <AddPasskeyButton />
            <p className="mt-3 text-sm text-ink-3">{t.security.syncNote}</p>
          </div>
        </Card>
      </section>

      <section aria-labelledby="factors" className="space-y-3">
        <h2 id="factors" className="text-lg font-semibold">{t.security.recovery}</h2>
        <Card className="divide-y divide-line">
          <div className="flex items-center gap-3.5 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sunken text-ink-2"><Smartphone className="size-5" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{t.security.sim}</p>
              <p className="font-mono text-sm text-ink-3 tabular">{data.phones.join(", ")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3.5 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sunken text-ink-2"><ScanFace className="size-5" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{t.security.face}</p>
              <p className="text-sm text-ink-3">
                {fmt(t.security.faceChecked, { date: formatDate(profile.lastLivenessAt, locale) })} · {fmt(t.security.faceDue, { date: formatDate(profile.livenessDueAt, locale) })}
              </p>
            </div>
            <ButtonLink href="/wallet/renew" size="sm" variant="secondary">{t.wallet.renewNow}</ButtonLink>
          </div>
        </Card>
        <p className="text-sm text-ink-3">
          {t.security.stored}{" "}
          <Link href="/trust" className="font-medium text-brand underline-offset-4 hover:underline">{t.security.storedLink}</Link>
        </p>
      </section>
    </div>
  );
}
