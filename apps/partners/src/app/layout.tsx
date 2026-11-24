import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const latin = Geist({ subsets: ["latin"], variable: "--font-latin", display: "swap" });
const code = Geist_Mono({ subsets: ["latin"], variable: "--font-code", display: "swap" });

export const metadata: Metadata = { title: "AmarID demo partners", description: "Two fictional businesses that integrate AmarID over standard OpenID Connect." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${latin.variable} ${code.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <div className="bg-ink px-4 py-1.5 text-center text-xs text-white/90">
          <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">DEMO</span>
          Fictional businesses. They are separate apps that use AmarID exactly as a real partner would.
        </div>
        {children}
      </body>
    </html>
  );
}
