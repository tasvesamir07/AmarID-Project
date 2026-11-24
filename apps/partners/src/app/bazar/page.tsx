import { BadgeCheck, CircleAlert, ShoppingBag, Smartphone, Ticket } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AmarIdButton } from "@/components/amarid-button";
import { Received } from "@/components/received";
import { getAccount } from "@/lib/session";
import { COUPON, store } from "@/lib/store";
import { claimCoupon, resetDemo, signOut, signUpWithPhone } from "./actions";

export const metadata: Metadata = { title: "Bazar Local" };
export const dynamic = "force-dynamic";

const products = [
  { name: "Jamdani saree", price: 4200, emoji: "🧵" },
  { name: "Nakshi kantha", price: 2600, emoji: "🪡" },
  { name: "Rajshahi mangoes, 5 kg", price: 950, emoji: "🥭" },
  { name: "Clay tea set", price: 780, emoji: "🫖" },
];

const errors: Record<string, string> = {
  phone: "Enter a Bangladeshi mobile number, such as 01712345678.",
  declined: "You chose not to share with Bazar Local. Nothing was received.",
  expired: "That sign-in took too long. Please try again.",
  failed: "Sign-in could not be completed. Please try again.",
  unavailable: "AmarID could not be reached. Is the identity provider running?",
};

export default async function Bazar({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const account = await getAccount("bazar");
  const phoneClaims = store.couponByPhone.size;
  const idClaims = store.couponBySub.size;
  const claimed = account ? (account.kind === "phone" ? store.couponByPhone.has(account.phone) : store.couponBySub.has(account.sub)) : false;

  return (
    <div className="flex-1 bg-bazar-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/bazar" className="flex items-center gap-2.5 text-lg font-semibold">
            <span className="grid size-9 place-items-center rounded-xl bg-bazar text-white"><ShoppingBag className="size-5" aria-hidden /></span>
            Bazar Local
          </Link>
          {account && (
            <form action={signOut} className="flex items-center gap-3 text-sm">
              <span className="hidden text-ink-3 sm:inline">{account.kind === "phone" ? `+880 ${account.phone.slice(1)}` : `AmarID · ${account.sub.slice(0, 8)}…`}</span>
              <button className="rounded-lg border border-line px-3 py-1.5 font-medium hover:bg-bazar-soft">Sign out</button>
            </form>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <section className="flex flex-col gap-4 rounded-3xl bg-bazar p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="space-y-1.5">
            <p className="flex items-center gap-2 text-sm font-medium text-white/80"><Ticket className="size-4" aria-hidden />New customer offer</p>
            <h1 className="text-3xl font-semibold">৳{COUPON.amount} off your first order</h1>
            <p className="text-white/85">Code <span className="font-mono font-semibold">{COUPON.code}</span> · one per customer.</p>
          </div>
          {account && (
            claimed ? (
              <p className="rounded-xl bg-white/15 px-4 py-3 text-sm font-medium">
                {account.kind === "amarid" ? "Already claimed by you. One per person — a new SIM does not make a new you." : "Claimed on this number."}
              </p>
            ) : (
              <form action={claimCoupon}>
                <button className="h-12 rounded-xl bg-white px-6 font-semibold text-bazar-strong hover:bg-bazar-soft">Claim coupon</button>
              </form>
            )
          )}
        </section>

        {error && errors[error] && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad"><CircleAlert className="size-4 shrink-0" aria-hidden />{errors[error]}</p>
        )}

        {!account && (
          <section aria-labelledby="join" className="grid gap-5 md:grid-cols-2">
            <h2 id="join" className="sr-only">Sign in</h2>
            <div className="space-y-4 rounded-2xl border border-line bg-white p-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">The usual way</p>
                <h3 className="text-lg font-semibold">Sign up with a phone number</h3>
                <p className="text-sm text-ink-2">Every number is a new customer. Try a second number and claim the coupon again.</p>
              </div>
              <form action={signUpWithPhone} className="flex gap-2">
                <label htmlFor="phone" className="sr-only">Mobile number</label>
                <input id="phone" name="phone" inputMode="tel" placeholder="01XXXXXXXXX" required className="h-12 min-w-0 flex-1 rounded-xl border border-line px-3.5 font-mono focus:border-bazar focus:outline-none" />
                <button className="flex h-12 items-center gap-2 rounded-xl bg-ink px-4 font-medium text-white hover:bg-black"><Smartphone className="size-4" aria-hidden />Join</button>
              </form>
            </div>
            <div className="space-y-4 rounded-2xl border-2 border-amarid/30 bg-white p-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-amarid">With AmarID</p>
                <h3 className="text-lg font-semibold">One tap, one account per person</h3>
                <p className="text-sm text-ink-2">Bazar Local learns that you are one real adult. It never sees your NID, your number or your name.</p>
              </div>
              <AmarIdButton href="/bazar/login" />
            </div>
          </section>
        )}

        <section aria-labelledby="ledger" className="rounded-2xl border border-line bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 id="ledger" className="text-lg font-semibold">Coupon ledger</h2>
              <p className="text-sm text-ink-2">What the “one per customer” rule actually achieved.</p>
            </div>
            <form action={resetDemo}><button className="text-sm text-ink-3 underline-offset-4 hover:underline">Reset demo</button></form>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className={`rounded-xl p-4 ${phoneClaims > 1 ? "bg-bad-soft" : "bg-bazar-paper"}`}>
              <p className="text-sm text-ink-2">Claims by phone-number accounts</p>
              <p className="text-3xl font-semibold tabular-nums">{phoneClaims}</p>
              <p className={`text-sm ${phoneClaims > 1 ? "font-medium text-bad" : "text-ink-3"}`}>
                {phoneClaims > 1 ? `৳${phoneClaims * COUPON.amount} given away — the shop cannot tell these are one person.` : "Each new number can claim again."}
              </p>
            </div>
            <div className="rounded-xl bg-ok-soft p-4">
              <p className="text-sm text-ink-2">Claims by AmarID accounts</p>
              <p className="text-3xl font-semibold tabular-nums">{idClaims}</p>
              <p className="flex items-center gap-1.5 text-sm font-medium text-ok"><BadgeCheck className="size-4" aria-hidden />One claim per real person, guaranteed.</p>
            </div>
          </div>
        </section>

        {account?.kind === "amarid" && <Received tone="bazar" claims={account.claims} missing={["name", "NID or passport number", "date of birth", "phone number", "Universal ID"]} />}

        <section aria-labelledby="products" className="space-y-4">
          <h2 id="products" className="text-lg font-semibold">Popular this week</h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((p) => (
              <li key={p.name} className="space-y-2 rounded-2xl border border-line bg-white p-4">
                <div className="grid aspect-square place-items-center rounded-xl bg-bazar-soft text-5xl" aria-hidden>{p.emoji}</div>
                <p className="font-medium">{p.name}</p>
                <p className="text-ink-2 tabular-nums">৳{p.price.toLocaleString("en-IN")}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
