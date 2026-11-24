import { ArrowRight, ArrowUpRight, Check, Code2, FileWarning, Fingerprint, Globe2, Lock, ShieldCheck, ShoppingBag, Users, Wallet, X } from "lucide-react";
import Link from "next/link";
import { AllowArt, FaceArt, LockArt, NidArt } from "@/components/illustrations";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ButtonLink, Logo } from "@/components/ui";
import { formatNumber } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";
import { env } from "@/server/env";

const problemIcons = [FileWarning, Globe2, Users];
const stepArt = [NidArt, FaceArt, LockArt, AllowArt];

// The demos keep their own colours so each tile is recognisable at a glance.
const demoStyle = [
  { path: "/bkash", icon: Wallet, tile: "bg-[#e2136e]", text: "text-[#b80d58]", ring: "hover:ring-[#e2136e]/40" },
  { path: "/daraz", icon: ShoppingBag, tile: "bg-[#c2410c]", text: "text-[#b93d00]", ring: "hover:ring-[#f85606]/40" },
  { path: "/abroad", icon: Globe2, tile: "bg-[#2a3fd4]", text: "text-[#1c2ba3]", ring: "hover:ring-[#2a3fd4]/40" },
];

export default async function LandingPage() {
  const { t, locale } = await getT();
  const l = t.landing;
  const partners = env().partnersUrl;

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Hero: the product moment is the consent screen, so that is what we show. */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-20">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-strong">
              <span aria-hidden className="relative grid h-5 w-8 place-items-center overflow-hidden rounded-[4px] bg-brand">
                <span className="size-2.5 -translate-x-0.5 rounded-full bg-flag" />
              </span>
              {l.eyebrow}
            </p>
            <h1 className="text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl lg:text-[4rem]">{l.title}</h1>
            <p className="max-w-xl text-lg text-ink-2 sm:text-xl">{l.body}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/enroll" size="lg">
                {l.cta}
                <ArrowRight className="size-4.5" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/signin" size="lg" variant="secondary">{l.ctaSecondary}</ButtonLink>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
              {l.pillars.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Check className="size-4 text-brand" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div role="img" aria-label={l.mock.label} className="relative mx-auto w-full max-w-[30rem] overflow-hidden rounded-[2.5rem] bg-brand-deep px-6 py-10 sm:px-10 sm:py-12">
            {/* The red disc on green: the flag, drawn large behind the screen. */}
            <span aria-hidden className="absolute left-[30%] top-[46%] size-[21rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-flag" />
            <span aria-hidden className="card-pattern absolute inset-0 opacity-70" />

            <p aria-hidden className="relative mb-3 mr-auto w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-white/95 px-3.5 py-2 text-sm font-medium text-ink shadow-(--shadow-card)">
              {l.mock.chipAsk}
            </p>

            <div aria-hidden className="relative mx-auto w-full max-w-[19rem] rounded-[1.75rem] bg-surface p-5 shadow-(--shadow-lift)">
              <div className="flex items-center justify-between">
                <Logo size="sm" />
                <Lock className="size-4 text-ink-3" />
              </div>
              <p className="mt-4 text-[17px] font-semibold leading-snug">{l.mock.asks}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-ink-3">{l.mock.receives}</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li className="flex items-center justify-between gap-3 rounded-lg bg-brand-soft/70 px-3 py-2">
                  <span className="text-ink-2">{l.mock.privateId}</span>
                  <Check className="size-4 shrink-0 text-brand" />
                </li>
                {l.sampleFacts.map((f) => (
                  <li key={f.label} className="flex items-center justify-between gap-3 rounded-lg bg-brand-soft/70 px-3 py-2">
                    <span className="text-ink-2">{f.label}</span>
                    <span className="font-semibold text-brand-strong">{f.value}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-ink-3">{l.sampleNot}</p>
              <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
                <span className="grid h-11 place-items-center rounded-xl border border-line-strong px-4 text-sm font-medium text-ink-2">{l.mock.cancel}</span>
                <span className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white">
                  <Fingerprint className="size-4" />
                  {l.mock.allow}
                </span>
              </div>
            </div>

            <p aria-hidden className="relative ml-auto mt-3 flex w-fit max-w-[85%] items-center gap-2 rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-sm font-medium text-white shadow-(--shadow-card)">
              <ShieldCheck className="size-4 shrink-0 text-[#7ee0b0]" />
              {l.mock.chipAnswer}
            </p>
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
              const Art = stepArt[i]!;
              return (
                <li key={s.title} className="flex flex-col overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
                  <div className="flex justify-center bg-sunken/70 px-5 py-5"><Art className="h-auto w-full max-w-[13rem]" /></div>
                  <div className="flex gap-3.5 p-5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-lg font-semibold text-white tabular">{formatNumber(i + 1, locale)}</span>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-snug">{s.title}</h3>
                      <p className="text-[15px] text-ink-2">{s.body}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Try it */}
        <section id="demos" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl space-y-8 px-4 py-14 sm:px-6 sm:py-16">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-semibold sm:text-4xl">{l.tryTitle}</h2>
              <p className="text-lg text-ink-2">{l.tryBody}</p>
            </div>
            <ul className="grid gap-5 md:grid-cols-3">
              {l.demos.map((d, i) => {
                const s = demoStyle[i]!;
                return (
                  <li key={d.name}>
                    <a href={`${partners}${s.path}`} className={`group flex h-full flex-col gap-4 rounded-3xl bg-paper p-6 ring-1 ring-line transition-shadow hover:shadow-(--shadow-lift) hover:ring-2 ${s.ring}`}>
                      <div className="flex items-start justify-between">
                        <span className={`grid size-12 place-items-center rounded-2xl text-white ${s.tile}`}><s.icon className="size-6" aria-hidden /></span>
                        <ArrowUpRight className="size-5 text-ink-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">{d.kind}</p>
                        <h3 className="text-xl font-semibold">{d.name}</h3>
                        <p className="text-ink-2">{d.body}</p>
                      </div>
                      <p className="rounded-xl bg-surface px-3 py-2 text-sm text-ink-2 ring-1 ring-line">
                        {l.demoShows}: <span className="font-semibold text-ink">{d.shows}</span>
                      </p>
                      <span className={`font-semibold ${s.text}`}>{d.cta}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Comparison */}
        <section className="bg-brand-deep text-white">
          <div className="mx-auto max-w-6xl space-y-10 px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-semibold sm:text-4xl">{l.compareTitle}</h2>
              <p className="text-lg text-white/75">{l.compareBody}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4 rounded-3xl bg-white/6 p-6 ring-1 ring-white/12">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">{l.today.title}</h3>
                <ul className="space-y-3">
                  {l.today.items.map((item) => (
                    <li key={item} className="flex gap-3 text-white/85">
                      <X className="mt-0.5 size-5 shrink-0 text-[#ff8f86]" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4 rounded-3xl bg-white p-6 text-ink shadow-(--shadow-lift)">
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

        {/* Problem */}
        <section className="border-y border-line bg-surface/70">
          <div className="mx-auto max-w-6xl space-y-10 px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="max-w-2xl text-3xl font-semibold sm:text-4xl">{l.problemTitle}</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {l.problems.map((p, i) => {
                const Icon = problemIcons[i]!;
                return (
                  <div key={p.title} className="space-y-3 rounded-3xl bg-paper p-6 ring-1 ring-line">
                    <span className="grid size-11 place-items-center rounded-xl bg-danger-soft text-danger"><Icon className="size-5" aria-hidden /></span>
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                    <p className="text-ink-2">{p.body}</p>
                  </div>
                );
              })}
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

        {/* Closing */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5 rounded-3xl bg-brand p-7 text-white sm:p-10">
              <h2 className="text-3xl font-semibold sm:text-4xl">{l.finalTitle}</h2>
              <p className="max-w-lg text-white/85">{l.finalBody}</p>
              <Link href="/enroll" className="inline-flex h-13 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-brand-strong hover:bg-brand-soft">
                {l.cta}
                <ArrowRight className="size-4.5" aria-hidden />
              </Link>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl bg-surface p-7 ring-1 ring-line sm:p-8">
              <span className="grid size-11 place-items-center rounded-xl bg-sunken text-ink"><Code2 className="size-5" aria-hidden /></span>
              <h2 className="text-xl font-semibold">{l.devTitle}</h2>
              <p className="flex-1 text-ink-2">{l.devBody}</p>
              <Link href="/developers" className="inline-flex items-center gap-1.5 font-medium text-brand underline-offset-4 hover:underline">
                {l.devCta}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
