import { BadgeCheck, Search, ShoppingCart, Smartphone, Ticket, User, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AmarIdButton } from "@/components/amarid-button";
import { DemoNotes, ErrorNote, Unlinkable } from "@/components/demo-notes";
import { Received } from "@/components/received";
import { getAccount } from "@/lib/session";
import { store, VOUCHER } from "@/lib/store";
import { collectVoucher, resetDemo, signOut, signUpWithPhone } from "./actions";

export const metadata: Metadata = { title: "Daraz (demo)" };
export const dynamic = "force-dynamic";

const categories = ["Groceries", "Mobiles", "Fashion", "Home & Living", "Beauty", "Electronics", "Sports", "Books"];

const products = [
  { name: "Wireless earbuds, noise cancelling", price: 1290, was: 2500, emoji: "🎧", sold: 412 },
  { name: "Cotton panjabi, navy blue", price: 890, was: 1450, emoji: "👕", sold: 238 },
  { name: "Rice cooker 1.8 L", price: 2150, was: 3200, emoji: "🍚", sold: 97 },
  { name: "Smart watch, AMOLED display", price: 1990, was: 4500, emoji: "⌚", sold: 655 },
  { name: "Backpack, water resistant", price: 760, was: 1200, emoji: "🎒", sold: 184 },
  { name: "Rajshahi mangoes, 5 kg", price: 950, was: 1100, emoji: "🥭", sold: 321 },
];

const errors: Record<string, string> = {
  phone: "Enter a Bangladeshi mobile number, such as 01712345678.",
  declined: "You chose not to share. Nothing was received.",
  expired: "That sign-in took too long. Please try again.",
  failed: "Sign-in could not be completed. Please try again.",
  unavailable: "AmarID could not be reached. Is the identity provider running?",
};

const taka = (n: number) => `৳ ${n.toLocaleString("en-IN")}`;

export default async function DarazDemo({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const account = await getAccount("daraz");
  const wallet = await getAccount("bkash");
  const phoneClaims = store.voucherByPhone.size;
  const idClaims = store.voucherBySub.size;
  const collected = account ? (account.kind === "phone" ? store.voucherByPhone.has(account.phone) : store.voucherBySub.has(account.sub)) : false;

  return (
    <div className="flex-1 bg-shop-paper">
      <header className="bg-shop text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
          <Link href="/daraz" className="text-[28px] font-extrabold leading-none tracking-tight">Daraz</Link>
          <form role="search" action="/daraz" className="order-3 flex h-11 w-full overflow-hidden rounded-lg bg-white sm:order-none sm:w-auto sm:flex-1">
            <label htmlFor="q" className="sr-only">Search in Daraz</label>
            <input id="q" name="q" placeholder="Search in Daraz" className="min-w-0 flex-1 px-4 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none" />
            <button aria-label="Search" className="grid w-12 place-items-center bg-shop-soft text-shop-strong"><Search className="size-5" aria-hidden /></button>
          </form>
          <div className="ml-auto flex items-center gap-4 text-sm font-semibold">
            {account ? (
              <form action={signOut} className="flex items-center gap-3">
                <span className="flex items-center gap-1.5"><User className="size-4.5" aria-hidden />{account.kind === "phone" ? `0${account.phone.slice(1, 4)}•••${account.phone.slice(-3)}` : "AmarID member"}</span>
                <button className="rounded-md bg-white/20 px-2.5 py-1 hover:bg-white/30">Logout</button>
              </form>
            ) : (
              <a href="#login" className="flex items-center gap-1.5"><User className="size-4.5" aria-hidden />Login / Sign up</a>
            )}
            <ShoppingCart className="size-6" aria-label="Cart" />
          </div>
        </div>
      </header>
      <nav aria-label="Categories" className="border-b border-line bg-white">
        <ul className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 py-2.5 text-sm text-ink-2">
          {categories.map((c) => <li key={c} className="shrink-0">{c}</li>)}
        </ul>
      </nav>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5">
        <section className="flex flex-col gap-4 overflow-hidden rounded-xl bg-gradient-to-r from-shop-navy via-[#3a1a8a] to-shop p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="space-y-1.5">
            <p className="flex items-center gap-2 text-sm font-semibold text-white/85"><Ticket className="size-4" aria-hidden />New user voucher</p>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{taka(VOUCHER.amount)} off your first order</h1>
            <p className="text-white/85">Code <span className="font-mono font-semibold">{VOUCHER.code}</span> · one per customer</p>
          </div>
          {account ? (
            collected ? (
              <p className="rounded-lg bg-white/15 px-4 py-3 text-sm font-medium">
                {account.kind === "amarid" ? "Already collected by you. One per person: a new SIM does not make a new you." : "Collected on this number."}
              </p>
            ) : (
              <form action={collectVoucher}><button className="h-12 rounded-lg bg-white px-7 font-bold text-shop-strong hover:bg-shop-soft">Collect</button></form>
            )
          ) : (
            <a href="#login" className="grid h-12 place-items-center rounded-lg bg-white px-7 font-bold text-shop-strong hover:bg-shop-soft">Login to collect</a>
          )}
        </section>

        {error && errors[error] && <ErrorNote>{errors[error]}</ErrorNote>}

        {!account && (
          <section id="login" aria-labelledby="login-title" className="scroll-mt-4 rounded-xl bg-white p-5 sm:p-6">
            <h2 id="login-title" className="text-xl font-semibold">Welcome to Daraz! Please login.</h2>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <form action={signUpWithPhone} className="space-y-3 rounded-lg border border-line p-4">
                <label htmlFor="phone" className="block text-sm font-medium">Phone number</label>
                <input id="phone" name="phone" inputMode="tel" autoComplete="off" placeholder="01XXXXXXXXX" required className="h-12 w-full rounded-lg border border-line px-3.5 font-mono focus:border-shop focus:outline-none" />
                <button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-shop-strong font-semibold text-white hover:brightness-110"><Smartphone className="size-4" aria-hidden />Sign up with phone</button>
                <p className="text-xs text-ink-3">Demo: no code is sent. Every new number becomes a new customer.</p>
              </form>
              <div className="space-y-3 rounded-lg border-2 border-amarid/30 p-4">
                <p className="text-sm font-medium">Or sign in as one verified person</p>
                <AmarIdButton href="/daraz/login" />
                <p className="text-xs text-ink-3">The shop learns that you are one real adult. It never sees your NID, your number or your name.</p>
              </div>
            </div>
          </section>
        )}

        <DemoNotes
          title="What the “one per customer” rule achieved"
          action={<form action={resetDemo}><button className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-50">Reset demo</button></form>}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={`rounded-2xl border p-4 ${phoneClaims > 1 ? "border-bad/30 bg-bad-soft" : "border-line bg-white"}`}>
              <p className="text-sm text-ink-2">Vouchers collected by phone-number accounts</p>
              <p className="text-3xl font-semibold tabular-nums">{phoneClaims}</p>
              <p className={`text-sm ${phoneClaims > 1 ? "font-medium text-bad" : "text-ink-3"}`}>
                {phoneClaims > 1 ? `${taka(phoneClaims * VOUCHER.amount)} given away. The shop cannot tell these are one person.` : "Sign up with a second number and collect again."}
              </p>
            </div>
            <div className="rounded-2xl border border-ok/20 bg-ok-soft p-4">
              <p className="text-sm text-ink-2">Vouchers collected by AmarID accounts</p>
              <p className="text-3xl font-semibold tabular-nums">{idClaims}</p>
              <p className="flex items-center gap-1.5 text-sm font-medium text-ok"><BadgeCheck className="size-4 shrink-0" aria-hidden />One per real person, whatever SIM they use.</p>
            </div>
          </div>
          {account?.kind === "amarid" && wallet?.kind === "amarid" && <Unlinkable here={{ site: "Daraz (demo)", sub: account.sub }} there={{ site: "bKash (demo)", sub: wallet.sub }} />}
          {account?.kind === "amarid" && <Received site="this shop" claims={account.claims} missing={["name", "NID or passport number", "date of birth", "phone number", "Universal ID"]} />}
        </DemoNotes>

        <section aria-labelledby="flash" className="rounded-xl bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 id="flash" className="flex items-center gap-2 text-lg font-semibold text-shop-strong"><Zap className="size-5 fill-current" aria-hidden />Flash Sale</h2>
            <span className="rounded-md border border-shop-strong px-3 py-1 text-sm font-semibold text-shop-strong">Shop all products</span>
          </div>
          <ul className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
            {products.map((p) => (
              <li key={p.name} className="space-y-1.5 bg-white p-3">
                <div className="grid aspect-square place-items-center rounded-lg bg-shop-paper text-5xl" aria-hidden>{p.emoji}</div>
                <p className="line-clamp-2 min-h-10 text-sm leading-5">{p.name}</p>
                <p className="text-lg font-semibold text-shop-strong tabular-nums">{taka(p.price)}</p>
                <p className="text-xs text-ink-3 tabular-nums"><s>{taka(p.was)}</s> <span className="text-ink-2">-{Math.round((1 - p.price / p.was) * 100)}%</span></p>
                <p className="text-xs text-ink-3 tabular-nums">{p.sold} sold</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
