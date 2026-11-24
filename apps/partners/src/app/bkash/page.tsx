import { BadgeCheck, Banknote, Camera, ChevronRight, Clock, HandCoins, Home, IdCard, Lightbulb, Mail, PiggyBank, PlusCircle, QrCode, ScanFace, Send, ShoppingBag, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import { AmarIdButton } from "@/components/amarid-button";
import { DemoNotes, ErrorNote, Unlinkable } from "@/components/demo-notes";
import { Phone } from "@/components/phone";
import { Received } from "@/components/received";
import { getAccount } from "@/lib/session";
import { store } from "@/lib/store";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "bKash (demo)" };
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  declined: "You chose not to share. Nothing was received, and no account was opened.",
  expired: "That took too long. Please try again.",
  failed: "Verification could not be completed. Please try again.",
  unavailable: "AmarID could not be reached. Is the identity provider running?",
};

const services = [
  { name: "Send Money", icon: Send },
  { name: "Mobile Recharge", icon: Smartphone },
  { name: "Cash Out", icon: Banknote },
  { name: "Make Payment", icon: ShoppingBag },
  { name: "Add Money", icon: PlusCircle },
  { name: "Pay Bill", icon: Lightbulb },
  { name: "Savings", icon: PiggyBank },
  { name: "Loan", icon: HandCoins },
];

const usualSteps = [
  { icon: IdCard, text: "Photograph the front of your NID" },
  { icon: IdCard, text: "Photograph the back of your NID" },
  { icon: ScanFace, text: "Record a selfie, blinking and turning" },
  { icon: Clock, text: "Wait while the details are checked" },
];

type Verified = {
  verification?: { trust_framework?: string; assurance_level?: string; evidence?: { type: string; method?: string; record?: { type: string } }[] };
  claims?: { name?: string; birthdate?: string; nationalities?: string[] };
};

function Wordmark({ tone = "pink" }: { tone?: "pink" | "white" }) {
  return (
    <span className={`flex items-baseline gap-2 font-bold tracking-tight ${tone === "white" ? "text-white" : "text-wallet"}`}>
      <span className="text-2xl">bKash</span>
      <span lang="bn" className="text-lg font-semibold">বিকাশ</span>
    </span>
  );
}

export default async function BkashDemo({ searchParams }: { searchParams: Promise<{ error?: string; welcome?: string }> }) {
  const { error, welcome } = await searchParams;
  const session = await getAccount("bkash");
  const account = session?.kind === "amarid" ? session : null;
  const shop = await getAccount("daraz");

  let opened = account ? store.walletAccounts.get(account.sub) : undefined;
  if (account && !opened) {
    // e-KYC is complete the moment the verified record arrives: open the account.
    opened = { openedAt: Date.now(), seconds: Number(welcome) || 0 };
    store.walletAccounts.set(account.sub, opened);
  }
  const verified = (account?.claims.verified_claims ?? {}) as Verified;
  const name = verified.claims?.name ?? String(account?.claims.name ?? "");
  const phone = String(account?.claims.phone_number ?? "");

  return (
    <main className="flex-1 bg-wallet-paper">
      <div className="mx-auto grid max-w-6xl gap-8 sm:px-6 sm:py-10 lg:grid-cols-[392px_1fr] lg:items-start lg:gap-12">
        <Phone statusTone={account ? "light" : "dark"}>
          {!account || !opened ? (
            <div className="flex flex-1 flex-col gap-6 px-6 pb-8 pt-8 sm:pt-14">
              <Wordmark />
              <div className="space-y-1.5">
                <h1 className="text-[26px] font-semibold leading-tight">Open a bKash account</h1>
                <p lang="bn" className="text-ink-2">নতুন অ্যাকাউন্ট খুলুন, ঘরে বসেই</p>
              </div>

              {error && errors[error] && <ErrorNote>{errors[error]}</ErrorNote>}

              <div className="space-y-3 rounded-2xl bg-wallet-soft p-4">
                <p className="text-sm font-semibold text-wallet-strong">Verify in one step</p>
                <p className="text-sm text-ink-2">Your identity is confirmed by AmarID, with your approval. Nothing to photograph.</p>
                <AmarIdButton href="/bkash/login" label="Open account with AmarID" />
              </div>

              <div className="space-y-3">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-3">
                  <Camera className="size-3.5" aria-hidden />
                  Registration today, without AmarID
                </p>
                <ol className="space-y-2">
                  {usualSteps.map((s, i) => (
                    <li key={s.text} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm text-ink-2">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-neutral-100 text-xs font-semibold tabular-nums text-ink-3">{i + 1}</span>
                      <s.icon className="size-4 shrink-0 text-ink-3" aria-hidden />
                      {s.text}
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-ink-3">Each service that does this keeps its own copy of your NID and your face.</p>
              </div>
            </div>
          ) : (
            <>
              <header className="rounded-b-[1.75rem] bg-wallet px-5 pb-6 pt-6 text-white sm:pt-12">
                <div className="flex items-center gap-3">
                  <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-lg font-bold text-wallet">{name.trim().charAt(0).toUpperCase() || "A"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{name || "Account holder"}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-wallet">
                      <span aria-hidden className="grid size-4 place-items-center rounded-full bg-wallet text-[10px] text-white">৳</span>
                      Balance 0.00
                    </p>
                  </div>
                  <Wordmark tone="white" />
                </div>
              </header>

              <div className="flex-1 space-y-5 px-5 py-5">
                <p className="flex items-start gap-2.5 rounded-2xl bg-ok-soft px-4 py-3 text-sm text-ok">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <span>
                    <strong className="font-semibold">Your account is open.</strong>{" "}
                    {opened.seconds > 0 ? `Verified in ${opened.seconds} ${opened.seconds === 1 ? "second" : "seconds"}. ` : ""}No NID photo, no selfie.
                  </span>
                </p>

                <ul className="grid grid-cols-4 gap-x-2 gap-y-4">
                  {services.map((s) => (
                    <li key={s.name} className="flex flex-col items-center gap-1.5 text-center">
                      <span className="grid size-12 place-items-center rounded-2xl bg-wallet-soft text-wallet"><s.icon className="size-5.5" aria-hidden /></span>
                      <span className="text-[11px] font-medium leading-tight text-ink-2">{s.name}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between rounded-2xl border border-line px-4 py-3">
                  <div>
                    <p className="text-xs text-ink-3">Account number</p>
                    <p className="font-mono font-semibold tabular-nums">{phone || "Not shared"}</p>
                  </div>
                  <ChevronRight className="size-5 text-ink-3" aria-hidden />
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-wallet to-[#f0569a] p-4 text-white">
                  <p className="text-xs font-medium text-white/85">Welcome offer</p>
                  <p className="font-semibold">৳50 bonus on your first Add Money</p>
                </div>
              </div>

              <nav aria-label="App" className="grid grid-cols-3 items-end border-t border-line px-6 pb-4 pt-2 text-[11px] font-medium text-ink-3">
                <span className="flex flex-col items-center gap-1 text-wallet"><Home className="size-5" aria-hidden />Home</span>
                <span className="flex flex-col items-center gap-1">
                  <span className="-mt-7 grid size-14 place-items-center rounded-full bg-wallet text-white shadow-lg ring-4 ring-white"><QrCode className="size-6" aria-hidden /></span>
                  Scan QR
                </span>
                <span className="flex flex-col items-center gap-1"><Mail className="size-5" aria-hidden />Inbox</span>
              </nav>
            </>
          )}
        </Phone>

        <div className="space-y-5 px-4 pb-10 sm:px-0">
          {!account || !opened ? (
            <DemoNotes title="What this demo shows">
              <p className="text-ink-2">
                Opening a mobile wallet today means photographing your NID and recording your face for every provider. With AmarID the provider asks once, you approve, and it receives a verified record instead of your documents.
              </p>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-white p-4">
                  <dt className="text-sm font-semibold">The wallet receives</dt>
                  <dd className="mt-1 text-sm text-ink-2">Verified name, date of birth and mobile number, and how they were checked.</dd>
                </div>
                <div className="rounded-2xl border border-line bg-white p-4">
                  <dt className="text-sm font-semibold">The wallet never receives</dt>
                  <dd className="mt-1 text-sm text-ink-2">Your NID number, a photo of your NID, your face or your Universal ID.</dd>
                </div>
              </dl>
              <p className="text-sm text-ink-3">You need an AmarID first. Creating one takes about two minutes in the sandbox.</p>
            </DemoNotes>
          ) : (
            <DemoNotes
              title="What the wallet learned about you"
              action={<form action={signOut}><button className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-50">Sign out of the demo</button></form>}
            >
              <dl className="grid gap-x-8 gap-y-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2">
                <div><dt className="text-sm text-ink-3">Account holder</dt><dd className="text-lg font-medium">{name || "—"}</dd></div>
                <div><dt className="text-sm text-ink-3">Date of birth</dt><dd className="text-lg font-medium tabular-nums">{verified.claims?.birthdate ?? String(account.claims.birthdate ?? "—")}</dd></div>
                <div><dt className="text-sm text-ink-3">Mobile</dt><dd className="text-lg font-medium tabular-nums">{phone || "Not shared"}</dd></div>
                <div>
                  <dt className="text-sm text-ink-3">KYC assurance</dt>
                  <dd className="text-lg font-medium"><span className="capitalize">{verified.verification?.assurance_level ?? "—"}</span> <span className="text-sm font-normal text-ink-3">({verified.verification?.trust_framework})</span></dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-ink-3">Evidence checked by AmarID</dt>
                  <dd className="text-sm text-ink-2">{(verified.verification?.evidence ?? []).map((e) => e.record?.type ?? e.method ?? e.type).join(" · ").replaceAll("_", " ") || "—"}</dd>
                </div>
              </dl>
              {shop?.kind === "amarid" && <Unlinkable here={{ site: "bKash (demo)", sub: account.sub }} there={{ site: "Daraz (demo)", sub: shop.sub }} />}
              <Received site="this wallet" claims={account.claims} missing={["NID or passport number", "document photo or scan", "selfie or face data", "Universal ID"]} />
            </DemoNotes>
          )}
        </div>
      </div>
    </main>
  );
}
