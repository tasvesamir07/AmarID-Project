import { ArrowRight, Globe2, ShoppingBag, Wallet } from "lucide-react";
import Link from "next/link";
import { env } from "@/lib/env";

// Reads the issuer URL from the environment at request time, not at build time.
export const dynamic = "force-dynamic";

const demos = [
  {
    href: "/bkash",
    name: "bKash (demo)",
    kind: "Mobile wallet",
    body: "Open an account without photographing your NID or recording a selfie.",
    shows: "Instant e-KYC",
    icon: Wallet,
    tone: "bg-wallet text-white",
    link: "text-wallet-strong",
  },
  {
    href: "/daraz",
    name: "Daraz (demo)",
    kind: "Marketplace",
    body: "A new-user voucher, one per customer. Try to collect it twice.",
    shows: "One person, one account",
    icon: ShoppingBag,
    tone: "bg-shop text-white",
    link: "text-shop-strong",
  },
  {
    href: "/abroad",
    name: "GlobalVerify",
    kind: "Verification abroad",
    body: "Prove who you are to a university overseas. Your passport stays with you.",
    shows: "Cross-border privacy shield",
    icon: Globe2,
    tone: "bg-gv text-white",
    link: "text-gv-strong",
  },
];

export default function Index() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-12 sm:py-16">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-amarid">AmarID partner demos</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">Three places you would use it.</h1>
        <p className="text-lg text-ink-2">
          Each demo is a separate relying party of <a href={env.issuer} className="font-medium text-amarid underline underline-offset-4">AmarID</a>, connected with a standard OpenID Connect library. Create your AmarID first, then try them in any order.
        </p>
      </div>
      <ul className="grid gap-5 md:grid-cols-3">
        {demos.map((d) => (
          <li key={d.href}>
            <Link href={d.href} className="group flex h-full flex-col gap-4 rounded-3xl border border-line bg-white p-6 transition-shadow hover:shadow-xl">
              <span className={`grid size-12 place-items-center rounded-2xl ${d.tone}`}><d.icon className="size-6" aria-hidden /></span>
              <div className="flex-1 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">{d.kind}</p>
                <h2 className="text-xl font-semibold">{d.name}</h2>
                <p className="text-ink-2">{d.body}</p>
              </div>
              <p className="rounded-xl bg-amarid-paper px-3 py-2 text-sm font-medium text-amarid-strong">Shows: {d.shows}</p>
              <span className={`inline-flex items-center gap-1.5 font-semibold ${d.link}`}>Open demo <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
