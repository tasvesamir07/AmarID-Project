import Link from "next/link";
import type { ReactNode } from "react";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/server/session";
import { LanguageToggle } from "./language-toggle";
import { ButtonLink, Logo } from "./ui";

/** Full header for public pages. */
export async function SiteHeader() {
  const { t } = await getT();
  const auth = await getSession();
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="AmarID" className="shrink-0">
          <Logo compact />
        </Link>
        <nav aria-label={t.nav.main} className="ml-4 hidden items-center gap-1 text-sm text-ink-2 md:flex">
          <Link href="/#how" className="rounded-lg px-3 py-2 hover:bg-sunken hover:text-ink">{t.nav.how}</Link>
          <Link href="/trust" className="rounded-lg px-3 py-2 hover:bg-sunken hover:text-ink">{t.nav.trust}</Link>
          <Link href="/verify" className="rounded-lg px-3 py-2 hover:bg-sunken hover:text-ink">{t.nav.verify}</Link>
          <Link href="/developers" className="rounded-lg px-3 py-2 hover:bg-sunken hover:text-ink">{t.nav.developers}</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          {auth ? (
            <ButtonLink href="/wallet" size="sm">{t.nav.wallet}</ButtonLink>
          ) : (
            <>
              <ButtonLink href="/signin" size="sm" variant="ghost">{t.nav.signIn}</ButtonLink>
              <span className="max-sm:hidden"><ButtonLink href="/enroll" size="sm">{t.nav.getId}</ButtonLink></span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** Quiet header for focused flows: nothing to click away to by accident. */
export function FlowHeader({ exit }: { exit?: ReactNode }) {
  return (
    <header className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
      <Link href="/" aria-label="AmarID" className="shrink-0">
        <Logo compact />
      </Link>
      <div className="flex items-center gap-3 whitespace-nowrap">
        <LanguageToggle />
        {exit}
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const { t } = await getT();
  return (
    <footer className="mt-auto border-t border-line bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-ink-3 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo size="sm" />
          <p>{t.footer.blurb}</p>
        </div>
        <nav aria-label={t.footer.links} className="grid grid-cols-2 gap-x-10 gap-y-2">
          <Link href="/enroll" className="hover:text-ink">{t.nav.getId}</Link>
          <Link href="/trust" className="hover:text-ink">{t.nav.trust}</Link>
          <Link href="/signin" className="hover:text-ink">{t.nav.signIn}</Link>
          <Link href="/developers" className="hover:text-ink">{t.nav.developers}</Link>
          <Link href="/verify" className="hover:text-ink">{t.nav.verify}</Link>
          <Link href="/admin" className="hover:text-ink">{t.nav.operators}</Link>
        </nav>
      </div>
    </footer>
  );
}

/** Centered single-column page used by enrollment, sign-in, recovery and consent. */
export function FlowPage({ children, exit, wide }: { children: ReactNode; exit?: ReactNode; wide?: boolean }) {
  return (
    <>
      <FlowHeader exit={exit} />
      <main id="main" className={`mx-auto w-full flex-1 px-4 pb-16 pt-4 sm:px-6 sm:pt-8 ${wide ? "max-w-3xl" : "max-w-md"}`}>
        {children}
      </main>
    </>
  );
}
