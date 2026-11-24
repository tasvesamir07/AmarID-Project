import { BadgeCheck, Check, FileUp, Globe2, GraduationCap, Lock, ScanFace, Server, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AmarIdButton } from "@/components/amarid-button";
import { DemoNotes, ErrorNote } from "@/components/demo-notes";
import { Received } from "@/components/received";
import { getAccount } from "@/lib/session";
import { store } from "@/lib/store";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "GlobalVerify" };
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  declined: "You chose not to share. Nothing was received.",
  expired: "That took too long. Please try again.",
  failed: "Verification could not be completed. Please try again.",
  unavailable: "AmarID could not be reached. Is the identity provider running?",
};

const usual = ["A scan of your passport photo page", "Your passport number and date of birth", "A video of your face", "Kept on servers abroad for up to 5 years"];

export default async function AbroadDemo({ searchParams }: { searchParams: Promise<{ error?: string; welcome?: string }> }) {
  const { error, welcome } = await searchParams;
  const session = await getAccount("abroad");
  const account = session?.kind === "amarid" ? session : null;

  let check = account ? store.checks.get(account.sub) : undefined;
  if (account && !check) {
    check = { reference: `GV-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${String(Math.floor(1000 + Math.random() * 9000))}`, at: Date.now(), seconds: Number(welcome) || 0 };
    store.checks.set(account.sub, check);
  }
  const claims = account?.claims ?? {};
  const nationality = Array.isArray(claims.nationalities) && claims.nationalities.includes("BD") ? "Bangladeshi" : null;
  const facts: { label: string; value: string | null }[] = [
    { label: "Real, unique person", value: claims.amarid_unique === true ? "Confirmed" : null },
    { label: "Passport", value: claims.passport_verified === true ? "Verified by Bangladesh" : null },
    { label: "Nationality", value: nationality },
    { label: "Aged 18 or over", value: claims.age_over_18 === true ? "Yes" : claims.age_over_18 === false ? "No" : null },
    { label: "Legal name", value: typeof claims.name === "string" ? claims.name : null },
  ];

  return (
    <div className="flex-1 bg-gv-paper text-gv-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/abroad" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-lg bg-gv text-white"><Globe2 className="size-5" aria-hidden /></span>
            GlobalVerify
          </Link>
          <div className="flex items-center gap-4 text-sm text-ink-2">
            <span className="hidden sm:inline">Identity checks for 40+ countries</span>
            <span className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-medium"><Lock className="size-3.5" aria-hidden />London, UK</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:py-10">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gv-soft text-gv"><GraduationCap className="size-6" aria-hidden /></span>
          <p className="text-sm text-ink-2">
            <span className="block font-semibold text-gv-ink">Northbridge University · Postgraduate admissions</span>
            asked GlobalVerify to confirm who you are before issuing your offer letter.
          </p>
        </div>

        {error && errors[error] && <ErrorNote>{errors[error]}</ErrorNote>}

        {!account || !check ? (
          <>
            <div className="max-w-2xl space-y-2">
              <h1 className="text-3xl font-semibold sm:text-4xl">Confirm your identity</h1>
              <p className="text-lg text-ink-2">Choose how you want to prove who you are. The university needs five facts, not your passport.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <section aria-labelledby="usual" className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-neutral-100 text-ink-2"><FileUp className="size-5" aria-hidden /></span>
                  <h2 id="usual" className="text-lg font-semibold">Upload your passport</h2>
                </div>
                <p className="text-sm text-ink-2">The usual way. You hand over:</p>
                <ul className="space-y-2 text-sm">
                  {usual.map((u) => (
                    <li key={u} className="flex items-start gap-2.5 text-ink-2"><X className="mt-0.5 size-4 shrink-0 text-bad" aria-hidden />{u}</li>
                  ))}
                </ul>
                <button type="button" disabled className="h-12 w-full cursor-not-allowed rounded-xl border border-line bg-neutral-50 font-medium text-ink-3">Upload documents (not part of this demo)</button>
              </section>

              <section aria-labelledby="amarid" className="space-y-4 rounded-2xl bg-white p-6 ring-2 ring-gv">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-gv-soft text-gv"><BadgeCheck className="size-5" aria-hidden /></span>
                  <div>
                    <h2 id="amarid" className="text-lg font-semibold">Use your AmarID</h2>
                    <p className="text-xs font-medium text-gv">For citizens of Bangladesh · about 10 seconds</p>
                  </div>
                </div>
                <p className="text-sm text-ink-2">Bangladesh confirms the facts. Your passport stays with you.</p>
                <ul className="space-y-2 text-sm">
                  {["That you are a real, unique person", "That you hold a verified passport", "Your nationality", "That you are 18 or over", "Your legal name"].map((u) => (
                    <li key={u} className="flex items-start gap-2.5 text-ink-2"><Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />{u}</li>
                  ))}
                </ul>
                <AmarIdButton href="/abroad/login" label="Verify with AmarID" />
              </section>
            </div>
            <DemoNotes title="The cross-border privacy shield">
              <p className="text-ink-2">
                Students and workers going abroad are asked to upload passports to verification companies in other countries. With AmarID the foreign service receives signed answers from Bangladesh, and no document leaves the country.
              </p>
            </DemoNotes>
          </>
        ) : (
          <>
            <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-gv px-6 py-5 text-white sm:px-8">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="size-9" aria-hidden />
                  <div>
                    <h1 className="text-2xl font-semibold">Identity confirmed</h1>
                    <p className="text-sm text-white/85">{check.seconds > 0 ? `Completed in ${check.seconds} ${check.seconds === 1 ? "second" : "seconds"}. ` : ""}Result sent to Northbridge University.</p>
                  </div>
                </div>
                <p className="text-right text-sm"><span className="block text-white/75">Reference</span><span className="font-mono font-semibold">{check.reference}</span></p>
              </div>
              <dl className="grid gap-px bg-line sm:grid-cols-2">
                {facts.map((f) => (
                  <div key={f.label} className="flex items-center justify-between gap-4 bg-white px-6 py-4 sm:px-8">
                    <dt className="text-sm text-ink-2">{f.label}</dt>
                    <dd className={`flex items-center gap-1.5 font-semibold ${f.value ? "" : "text-ink-3"}`}>
                      {f.value && <Check className="size-4 text-ok" aria-hidden />}
                      {f.value ?? "Not shared"}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 text-sm text-ink-2 sm:px-8">
                <p className="flex items-center gap-2"><ScanFace className="size-4 text-gv" aria-hidden />Verified by AmarID, Bangladesh, from a civil record, a registered SIM and a live face check.</p>
                <form action={signOut}><button className="rounded-lg border border-line px-3 py-1.5 font-medium hover:bg-neutral-50">Start again</button></form>
              </div>
            </section>

            <DemoNotes title="What left Bangladesh">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-white p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold"><Server className="size-4 text-amarid" aria-hidden />Stored abroad</p>
                  <p className="mt-1 text-sm text-ink-2">The facts above and a private ID that only this service can use.</p>
                </div>
                <div className="rounded-2xl border border-line bg-white p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold"><Lock className="size-4 text-amarid" aria-hidden />Stayed home</p>
                  <p className="mt-1 text-sm text-ink-2">Your passport, its number, your date of birth, your phone number and your face.</p>
                </div>
              </div>
              <Received site="this service" claims={account.claims} missing={["passport or NID number", "document scan", "date of birth", "face image or video", "phone number", "Universal ID"]} />
            </DemoNotes>
          </>
        )}
      </main>
    </div>
  );
}
