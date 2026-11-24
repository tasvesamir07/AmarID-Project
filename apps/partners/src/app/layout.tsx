import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Hind_Siliguri } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const latin = Geist({ subsets: ["latin"], variable: "--font-latin", display: "swap" });
const code = Geist_Mono({ subsets: ["latin"], variable: "--font-code", display: "swap" });
const bangla = Hind_Siliguri({ subsets: ["bengali"], weight: ["400", "500", "600"], variable: "--font-bangla", display: "swap" });

export const metadata: Metadata = {
  title: { default: "AmarID partner demos", template: "%s · AmarID demo" },
  description: "Three concept demos that show where AmarID fits: a mobile wallet, a marketplace and a verification service abroad.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${latin.variable} ${code.variable} ${bangla.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <p className="bg-ink px-4 py-1.5 text-center text-xs text-white">
          <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">CONCEPT DEMO</span>
          Built for a competition to show an AmarID integration. Not affiliated with or endorsed by bKash or Daraz.
        </p>
        {children}
      </body>
    </html>
  );
}
