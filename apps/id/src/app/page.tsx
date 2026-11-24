import { ArrowRight, BadgeCheck, Check, FileWarning, Fingerprint, Globe2, IdCard, ShieldCheck, ToggleRight, UserCheck, Users, X } from "lucide-react";
import Link from "next/link";
import { IdentityCard } from "@/components/id-card";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ButtonLink, Card } from "@/components/ui";
import { getT } from "@/lib/i18n/server";
import { env } from "@/server/env";

const problemIcons = [FileWarning, Globe2, Users];
const stepIcons = [IdCard, UserCheck, Fingerprint, ToggleRight];

export default async function LandingPage() {
  const { t } = await getT();
  const l = t.landing;
  const partners = env().partnersUrl;

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand-strong">
              <ShieldCheck className="size-4" aria-hidden />
              {l.eyebrow}
            </p>
            <h1 className="text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[3.5rem]">{l.title}</h1>
            <p className="max-w-xl text-lg text-ink-2 sm:text-xl">{l.body}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/enroll" size="lg">
                {l.cta}
                <ArrowRight className="size-4.5" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/signin" size="lg" variant="secondary">{l.ctaSecondary}</ButtonLink>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-ink-2">
              {l.pillars.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Check className="size-4 text-brand" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:mr-0">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-soft via-transparent to-warn-soft/60 blur-2xl" aria-hidden />
            <IdentityCard name={l.sampleName} universalId="AID-7K4M-2Q9D-92QX" interactive={false} issued={l.sampleIssued} />
            <Card className="relative mt-3 ml-auto w-[88%] space-y-2.5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <BadgeCheck className="size-4 text-brand" aria-hidden />
                {l.sampleRequest}
              </p>
              <ul className="space-y-1.5 text-sm">
                {l.sampleFacts.map((f) => (
                  <li key={f.label} className="flex items-center justify-between rounded-lg bg-brand-soft/70 px-3 py-1.5">
                    <span className="text-ink-2">{f.label}</span>
                    <span className="font-semibold text-brand-strong">{f.value}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-ink-3">{l.sampleNot}</p>
            </Card>
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-line bg-surface/70">
          <div className="mx-auto max-w-6xl space-y-10 px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="max-w-2xl text-3xl font-semibold sm:text-4xl">{l.problemTitle}</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {l.problems.map((p, i) => {
                const Icon = problemIcons[i]!;
                return (
                  <div key={p.title} className="space-y-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-danger-soft text-danger"><Icon className="size-5" aria-hidden /></span>
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                    <p className="text-ink-2">{p.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 space-y-10 px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold sm:text-4xl">{l.howTitle}</h2>
            <p className="text-lg text-ink-2">{l.howBody}</p>
          </div>
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {l.steps.map((s, i) => {
              const Icon = stepIcons[i]!;
              return (
                <Card as="li" key={s.title} className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="size-5" aria-hidden /></span>
                    <span className="font-mono text-sm text-ink-3 tabular">0{i + 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="text-[15px] text-ink-2">{s.body}</p>
                </Card>
              );
            })}
          </ol>
        </section>

        {/* Comparison */}
        <section className="bg-brand-deep text-white">
          <div className="mx-auto max-w-6xl space-y-10 px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-semibold sm:text-4xl">{l.compareTitle}</h2>
              <p className="text-lg text-white/75">{l.compareBody}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4 rounded-2xl bg-white/6 p-6 ring-1 ring-white/12">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">{l.today.title}</h3>
                <ul className="space-y-3">
                  {l.today.items.map((item) => (
                    <li key={item} className="flex gap-3 text-white/85">
                      <X className="mt-0.5 size-5 shrink-0 text-[#ff8f86]" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4 rounded-2xl bg-white p-6 text-ink shadow-(--shadow-lift)">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-brand">{l.withAmarid.title}</h3>
                <ul className="space-y-3">
                  {l.withAmarid.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <Check className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="mx-auto max-w-6xl space-y-10 px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold sm:text-4xl">{l.trustTitle}</h2>
            <p className="text-lg text-ink-2">{l.trustBody}</p>
          </div>
          <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {l.trustPoints.map((p) => (
              <div key={p.title} className="flex gap-4">
                <ShieldCheck className="mt-1 size-5 shrink-0 text-brand" aria-hidden />
                <div className="space-y-1">
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-ink-2">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/trust" className="inline-flex items-center gap-1.5 font-medium text-brand underline-offset-4 hover:underline">
            {l.trustLink}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>

        {/* Try it */}
        <section className="border-t border-line bg-surface/70">
          <div className="mx-auto max-w-6xl space-y-8 px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-semibold sm:text-4xl">{l.tryTitle}</h2>
              <p className="text-lg text-ink-2">{l.tryBody}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {l.demos.map((d, i) => (
                <Card key={d.name} className="flex flex-col gap-3 p-6">
                  <h3 className="text-lg font-semibold">{d.name}</h3>
                  <p className="flex-1 text-ink-2">{d.body}</p>
                  <a href={i === 0 ? `${partners}/bazar` : i === 1 ? `${partners}/bank` : "/developers"} className="inline-flex items-center gap-1.5 font-medium text-brand underline-offset-4 hover:underline">
                    {d.cta}
                    <ArrowRight className="size-4" aria-hidden />
                  </a>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
