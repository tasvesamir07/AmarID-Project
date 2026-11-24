import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Hind_Siliguri } from "next/font/google";
import type { ReactNode } from "react";
import { LocaleProvider } from "@/lib/i18n/client";
import { getT } from "@/lib/i18n/server";
import { env } from "@/server/env";
import "./globals.css";

const latin = Geist({ subsets: ["latin"], variable: "--font-latin", display: "swap" });
const code = Geist_Mono({ subsets: ["latin"], variable: "--font-code", display: "swap" });
const bangla = Hind_Siliguri({ subsets: ["bengali"], weight: ["400", "500", "600", "700"], variable: "--font-bangla", display: "swap" });

export const metadata: Metadata = {
  title: { default: "AmarID — one person, one digital identity", template: "%s · AmarID" },
  description: "A privacy-first digital identity for Bangladesh. Sign in and verify yourself without sharing your NID.",
};

export const viewport: Viewport = { themeColor: "#f6f5f0", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { t, locale } = await getT();
  return (
    <html lang={locale} className={`${latin.variable} ${code.variable} ${bangla.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:shadow-(--shadow-card)">
          {t.common.skipToContent}
        </a>
        {env().sandbox && (
          <div className="bg-ink px-4 py-1.5 text-center text-xs text-white/90">
            <span className="mr-2 rounded bg-warn-soft px-1.5 py-0.5 font-semibold text-warn">{t.sandbox.badge}</span>
            {t.sandbox.banner}
          </div>
        )}
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
