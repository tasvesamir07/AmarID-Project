import { BadgeCheck, CircleAlert, Clock, FileX2, Landmark } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AmarIdButton } from "@/components/amarid-button";
import { Received } from "@/components/received";
import { getAccount } from "@/lib/session";
import { store } from "@/lib/store";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Probashi Bank" };
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  declined: "You chose not to share with Probashi Bank. Nothing was received, and no account was opened.",
  expired: "That took too long. Please try again.",
  failed: "Verification could not be completed. Please try again.",
  unavailable: "AmarID could not be reached. Is the identity provider running?",
};

type Verified = { verification?: { trust_framework?: string; assurance_level?: string; evidence?: { type: string; method?: string; record?: { type: string } }[] }; claims?: { name?: string; birthdate?: string; nationalities?: string[] } };

export default async function Bank({ searchParams }: { searchParams: Promise<{ error?: string; welcome?: string }> }) {
  const { error, welcome } = await searchParams;
  const session = await getAccount("bank");
  const account = session?.kind === "amarid" ? session : null;
  const bazar = await getAccount("bazar");

  let opened = account ? store.bankAccounts.get(account.sub) : undefined;
  if (account && !opened) {
    // KYC is complete the moment the verified record arrives: open the account.
    opened = { number: `2051 ${String(Math.floor(1000 + Math.random() * 9000))} ${String(Math.floor(1000 + Math.random() * 9000))}`, openedAt: Date.now(), seconds: Number(welcome) || 0 };
    store.bankAccounts.set(account.sub, opened);
  }
  const verified = (account?.claims.verified_claims ?? {}) as Verified;

  return (
    <div className="flex-1 bg-bank-paper">
      <header className="bg-bank text-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/bank" className="flex items-center gap-2.5 text-lg font-semibold">
            <Landmark className="size-6" aria-hidden />
            Probashi Bank
          </Link>
          {account && (
            <form action={signOut}><button className="rounded-lg border border-white/30 px-3 py-1.5 text-sm font-medium hover:bg-white/10">Sign out</button></form>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
        {error && errors[error] && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad"><CircleAlert className="size-4 shrink-0" aria-hidden />{errors[error]}</p>
        )}

        {!account || !opened ? (
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight">Open a savings account in under a minute.</h1>
              <p className="text-lg text-ink-2">No branch visit. No photocopies. No photo of your NID. Your identity is confirmed by AmarID, with your approval.</p>
              <ul className="space-y-2 text-ink-2">
                <li className="flex items-center gap-2.5"><FileX2 className="size-5 text-bank" aria-hidden />Nothing to upload</li>
                <li className="flex items-center gap-2.5"><BadgeCheck className="size-5 text-bank" aria-hidden />Verified name, date of birth and mobile number</li>
                <li className="flex items-center gap-2.5"><Clock className="size-5 text-bank" aria-hidden />Account number issued immediately</li>
              </ul>
            </div>
            <div className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Start your application</h2>
              <p className="text-sm text-ink-2">You will see exactly what the bank asks for, and approve it, before anything is shared.</p>
              <AmarIdButton href="/bank/login" label="Verify with AmarID" />
              <p className="text-xs text-ink-3">The traditional process — a form, document scans and a 2–3 day review — is what this replaces.</p>
            </div>
          </div>
        ) : (
          <>
            <section className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-12 place-items-center rounded-full bg-ok-soft text-ok"><BadgeCheck className="size-7" aria-hidden /></span>
                <div>
                  <h1 className="text-2xl font-semibold">Your account is open</h1>
                  <p className="text-ink-2">{opened.seconds > 0 ? `Identity verified in ${opened.seconds} ${opened.seconds === 1 ? "second" : "seconds"}. ` : ""}No documents were uploaded.</p>
                </div>
              </div>
              <dl className="grid gap-x-8 gap-y-4 border-t border-line pt-5 sm:grid-cols-2">
                <div><dt className="text-sm text-ink-3">Account number</dt><dd className="font-mono text-xl font-semibold tabular-nums">{opened.number}</dd></div>
                <div><dt className="text-sm text-ink-3">Account holder</dt><dd className="text-lg font-medium">{verified.claims?.name ?? String(account.claims.name ?? "—")}</dd></div>
                <div><dt className="text-sm text-ink-3">Date of birth</dt><dd className="text-lg font-medium tabular-nums">{verified.claims?.birthdate ?? String(account.claims.birthdate ?? "—")}</dd></div>
                <div><dt className="text-sm text-ink-3">Mobile</dt><dd className="text-lg font-medium tabular-nums">{String(account.claims.phone_number ?? "Not shared")}</dd></div>
                <div><dt className="text-sm text-ink-3">KYC assurance</dt><dd className="text-lg font-medium"><span className="capitalize">{verified.verification?.assurance_level ?? "—"}</span> <span className="text-sm font-normal text-ink-3">({verified.verification?.trust_framework})</span></dd></div>
                <div><dt className="text-sm text-ink-3">Evidence checked by AmarID</dt><dd className="text-sm text-ink-2">{(verified.verification?.evidence ?? []).map((e) => e.record?.type ?? e.method ?? e.type).join(" · ").replaceAll("_", " ") || "—"}</dd></div>
              </dl>
            </section>

            {bazar?.kind === "amarid" && (
              <section className="space-y-3 rounded-2xl border border-line bg-white p-6">
                <h2 className="text-lg font-semibold">Same person, two unlinkable IDs</h2>
                <p className="text-sm text-ink-2">You are also signed in to Bazar Local in this browser. AmarID gave each business a different ID for you, so they cannot combine their records.</p>
                <dl className="grid gap-3 font-mono text-[13px] sm:grid-cols-2">
                  <div className="rounded-xl bg-bank-soft p-3"><dt className="font-sans text-xs font-semibold text-bank-strong">Your ID at Probashi Bank</dt><dd className="break-all">{account.sub}</dd></div>
                  <div className="rounded-xl bg-bazar-soft p-3"><dt className="font-sans text-xs font-semibold text-bazar-strong">Your ID at Bazar Local</dt><dd className="break-all">{bazar.sub}</dd></div>
                </dl>
              </section>
            )}

            <Received tone="bank" claims={account.claims} missing={["NID or passport number", "document photo or scan", "selfie or face data", "Universal ID"]} />
          </>
        )}
      </main>
    </div>
  );
}
