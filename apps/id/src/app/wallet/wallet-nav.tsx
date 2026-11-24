"use client";

import { clsx } from "clsx";
import { Activity, AppWindow, Home, LogOut, ShieldCheck, Ticket } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { call } from "@/lib/api-client";
import { useT } from "@/lib/i18n/client";

const items = [
  { href: "/wallet", key: "home", icon: Home },
  { href: "/wallet/apps", key: "apps", icon: AppWindow },
  { href: "/wallet/passes", key: "passes", icon: Ticket },
  { href: "/wallet/activity", key: "activity", icon: Activity },
  { href: "/wallet/security", key: "security", icon: ShieldCheck },
] as const;

export function WalletNav({ variant }: { variant: "tabs" | "bar" }) {
  const t = useT();
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/wallet" ? pathname === "/wallet" || pathname === "/wallet/renew" : pathname.startsWith(href));

  if (variant === "bar") {
    return (
      <nav aria-label={t.wallet.nav.label} className="grid grid-cols-5">
        {items.map(({ href, key, icon: Icon }) => (
          <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className={clsx("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium", isActive(href) ? "text-brand" : "text-ink-3")}>
            <Icon className="size-5" aria-hidden />
            {t.wallet.nav[key]}
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav aria-label={t.wallet.nav.label} className="-mb-px flex gap-1">
      {items.map(({ href, key, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={clsx("flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors", isActive(href) ? "border-brand text-ink" : "border-transparent text-ink-3 hover:text-ink")}
        >
          <Icon className="size-4" aria-hidden />
          {t.wallet.nav[key]}
        </Link>
      ))}
    </nav>
  );
}

export function SignOutButton() {
  const t = useT();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await call("POST", "/api/auth/signout").catch(() => {});
        window.location.assign("/");
      }}
      className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink-2 hover:bg-sunken hover:text-ink disabled:opacity-60"
    >
      <LogOut className="size-4" aria-hidden />
      <span className="max-sm:sr-only">{t.wallet.signOut}</span>
    </button>
  );
}
