"use client";

import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

const names: Record<Locale, string> = { en: "English", bn: "বাংলা" };

export function LanguageToggle() {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div role="group" aria-label={t.common.language} className={clsx("inline-flex rounded-full bg-sunken p-0.5 text-sm", pending && "opacity-60")}>
      {(["en", "bn"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          onClick={() => choose(l)}
          className={clsx("rounded-full px-2.5 py-1 text-[13px] font-medium transition-colors sm:px-3 sm:text-sm", locale === l ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink")}
        >
          {names[l]}
        </button>
      ))}
    </div>
  );
}
