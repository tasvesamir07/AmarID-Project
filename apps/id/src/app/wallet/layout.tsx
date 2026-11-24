import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { Logo } from "@/components/ui";
import { getSession } from "@/server/session";
import { SignOutButton, WalletNav } from "./wallet-nav";

export const metadata = { title: "Your wallet", robots: { index: false } };

export default async function WalletLayout({ children }: { children: ReactNode }) {
  if (!(await getSession())) redirect("/signin?next=/wallet");
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-4 sm:px-6">
          <Link href="/wallet" aria-label="AmarID">
            <Logo compact />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            <SignOutButton />
          </div>
        </div>
        <div className="mx-auto hidden max-w-4xl px-4 sm:block sm:px-6">
          <WalletNav variant="tabs" />
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
        {children}
      </main>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <WalletNav variant="bar" />
      </div>
    </>
  );
}
