import { AppWindow, ArrowRight, Fingerprint, ScanFace, Ticket } from "lucide-react";
import Link from "next/link";
import { IdentityCard } from "@/components/id-card";
import { ButtonLink, Card, Notice } from "@/components/ui";
import { fmt, formatDate, formatRelative } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";
import { env } from "@/server/env";
import { walletData } from "@/server/me";
import { requireSession } from "@/server/session";
import { ActivityList } from "./activity-list";
import { SandboxClock } from "./sandbox-clock";

export default async function WalletHome() {
  const auth = await requireSession();
  const { t, locale } = await getT();
  const data = await walletData(auth);
  const { profile } = data;
  const activePasses = data.passes.filter((p) => p.state === "ACTIVE").length;
  const dueText = fmt(t.wallet.liveness[profile.livenessState], { when: formatRelative(profile.livenessDueAt, locale), date: formatDate(profile.livenessDueAt, locale) });

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-[minmax(0,26rem)_1fr] md:items-start">
        <IdentityCard name={profile.name} universalId={profile.universalId} status={profile.status} issued={formatDate(profile.issuedAt, locale)} />

        <div className="space-y-4">
          <div>
            <p className="text-sm text-ink-3">{t.wallet.greeting}</p>
            <h1 className="text-2xl font-semibold">{profile.name}</h1>
          </div>

          {profile.livenessState === "OK" ? (
            <Card className="flex items-center gap-3.5 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><ScanFace className="size-5" aria-hidden /></span>
              <div className="min-w-0 text-sm">
                <p className="font-medium text-ink">{t.wallet.livenessOkTitle}</p>
                <p className="text-ink-3">{dueText}</p>
              </div>
            </Card>
          ) : (
            <Notice tone={profile.livenessState === "DUE_SOON" ? "warn" : "error"} title={t.wallet.livenessTitle[profile.livenessState]}>
              <p>{dueText}</p>
              <ButtonLink href="/wallet/renew" size="sm" className="mt-3">{t.wallet.renewNow}</ButtonLink>
            </Notice>
          )}

          {data.passkeys.length === 0 && (
            <Notice tone="warn" title={t.wallet.noPasskeyTitle}>
              <p>{t.wallet.noPasskeyBody}</p>
              <ButtonLink href="/wallet/security" size="sm" variant="secondary" className="mt-3">
                <Fingerprint className="size-4" aria-hidden />
                {t.security.add}
              </ButtonLink>
            </Notice>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/wallet/apps" className="group">
          <Card className="flex h-full items-center gap-4 p-5 transition-shadow group-hover:shadow-(--shadow-lift)">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sunken text-ink-2"><AppWindow className="size-5" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{t.wallet.appsTitle}</p>
              <p className="text-sm text-ink-3">{fmt(data.grants.length === 1 ? t.wallet.appsCountOne : t.wallet.appsCount, { n: data.grants.length })}</p>
            </div>
            <ArrowRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Card>
        </Link>
        <Link href="/wallet/passes" className="group">
          <Card className="flex h-full items-center gap-4 p-5 transition-shadow group-hover:shadow-(--shadow-lift)">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sunken text-ink-2"><Ticket className="size-5" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{t.wallet.passesTitle}</p>
              <p className="text-sm text-ink-3">{activePasses > 0 ? fmt(t.wallet.passesCount, { n: activePasses }) : t.wallet.passesNone}</p>
            </div>
            <ArrowRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Card>
        </Link>
      </div>

      <section aria-labelledby="recent">
        <div className="mb-2 flex items-end justify-between">
          <h2 id="recent" className="text-lg font-semibold">{t.wallet.recent}</h2>
          <Link href="/wallet/activity" className="text-sm font-medium text-brand underline-offset-4 hover:underline">{t.wallet.seeAll}</Link>
        </div>
        <Card className="px-5">
          <ActivityList events={data.activity.slice(0, 5)} t={t} locale={locale} />
        </Card>
      </section>

      {env().sandbox && <SandboxClock partnersUrl={env().partnersUrl} />}
    </div>
  );
}
