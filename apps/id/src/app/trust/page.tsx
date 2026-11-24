import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge } from "@/components/ui";

export const metadata: Metadata = { title: "Trust and data" };

// Technical reference. Kept in English so the wording matches the source code
// and the documents reviewers will compare it with.

const stored: [string, ReactNode, string][] = [
  ["NID / passport number", <>A keyed blind index (HMAC-SHA-256). The number is used for the registry check and then discarded.</>, "To guarantee one document backs one identity."],
  ["Name and date of birth", <>Sealed with AES-256-GCM, bound to your record. Opened only for you and for partners you approve.</>, "To answer “name”, “over 18” and bank KYC."],
  ["Mobile number", <>Blind index for uniqueness, plus a sealed copy.</>, "One SIM backs one identity; account recovery."],
  ["Face", <>No image or video ever reaches the server. The device computes a numeric template; we pass it through a keyed, revocable transform and seal it.</>, "Uniqueness at enrollment (1:N) and proof of life (1:1)."],
  ["Fingerprint", <>Never leaves your device. It unlocks a passkey; we hold only the public key.</>, "Everyday sign-in."],
  ["Sessions, codes, tokens", <>Hashes only. One-time codes are keyed hashes that expire in five minutes.</>, "A database leak does not hand out working sessions."],
  ["Activity log", <>Ids, scopes and outcomes in a hash chain. No names, numbers or documents.</>, "So you — and an auditor — can see every use of your identity."],
];

const partnerGets: [string, string][] = [
  ["A private ID", "Different for every partner. Two partners cannot link you by comparing records, and none learns your Universal ID."],
  ["Yes/no facts", "“Real person”, “over 18”. A shop does not receive your birth date to learn that you are an adult."],
  ["Attributes you approve", "Name, birth date, phone or a verified KYC record — only for the scopes you switch on, and only regulated partners may ask for the sensitive ones."],
  ["Never", "Your document number, your document image, your face, your Universal ID."],
];

const limits: [string, string, string][] = [
  ["Civil registry check (NID, passport)", "Simulated. A sandbox registry with test records; unknown numbers are registered on first use.", "A verification agreement with the Election Commission (NID) and the Department of Immigration and Passports."],
  ["SIM ownership", "Simulated in the same way.", "Access to the BTRC biometric SIM registration data, through an operator or aggregator."],
  ["SMS delivery", "Simulated: the message appears in an on-screen “sandbox phone”.", "An SMS gateway contract."],
  ["Face liveness", "Real camera, real model, real random challenge — analysed on the device and reported by it. The server cannot prove the report came from an untampered camera.", "A certified presentation-attack-detection SDK (ISO/IEC 30107-3) with device attestation, or supervised capture at enrollment points."],
  ["Fingerprint", "The device’s own fingerprint or face unlock, through a passkey. Browsers cannot read raw fingerprints, so fingerprints are not compared between people.", "Certified scanners at enrollment points, matched against the national AFIS, if fingerprint uniqueness is required in addition to face."],
  ["Face uniqueness search", "Real, exact, linear scan over protected templates.", "An approximate-nearest-neighbour index running in a secure enclave; independent accuracy and bias evaluation."],
  ["“Zero-knowledge”", "Minimal disclosure: yes/no predicates, pairwise pseudonyms and per-scope consent. The partner learns only the approved fact. AmarID itself still sees which partner you sign in to.", "Unlinkable credential presentations (BBS+ or SD-JWT VC held in the wallet) so that not even AmarID sees where a credential is shown."],
  ["Key custody", "One master key in the environment; every other key derived from it with HKDF.", "Keys generated and held in an HSM or cloud KMS, with rotation and split custody."],
];

function Section({ id, title, intro, children }: { id: string; title: string; intro: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-5">
      <div className="max-w-2xl space-y-2">
        <h2 id={id} className="text-2xl font-semibold">{title}</h2>
        <p className="text-ink-2">{intro}</p>
      </div>
      {children}
    </section>
  );
}

export default function TrustPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" lang="en" className="mx-auto w-full max-w-4xl flex-1 space-y-14 px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-semibold sm:text-4xl">Trust and data</h1>
          <p className="text-lg text-ink-2">
            An identity system asks for a lot of trust. This page states exactly what AmarID keeps, what partners receive, and where this build still stands in for systems it does not own.
          </p>
        </div>

        <Section id="stored" title="What AmarID stores" intro="The rule is simple: if we do not need to read a value again, we do not keep it in a readable form.">
          <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
            <table className="w-full text-left text-[15px]">
              <thead className="bg-sunken text-sm text-ink-3">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Data</th>
                  <th scope="col" className="px-4 py-3 font-medium">How it is kept</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line align-top">
                {stored.map(([data, how, why]) => (
                  <tr key={data}>
                    <th scope="row" className="px-4 py-3.5 font-medium">{data}</th>
                    <td className="px-4 py-3.5 text-ink-2">{how}<span className="mt-1 block text-sm text-ink-3 md:hidden">{why}</span></td>
                    <td className="hidden px-4 py-3.5 text-ink-3 md:table-cell">{why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="partners" title="What a partner receives" intro="Partners integrate through standard OpenID Connect. What they get is decided by you, one scope at a time.">
          <dl className="grid gap-4 sm:grid-cols-2">
            {partnerGets.map(([term, text]) => (
              <div key={term} className="rounded-2xl bg-surface p-5 ring-1 ring-line">
                <dt className="font-semibold">{term}</dt>
                <dd className="mt-1 text-ink-2">{text}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="limits" title="What is real, and what is simulated" intro="This is a working sandbox, not a national deployment. The cryptography, the protocol and the product are real. The connections to government and telecom systems are simulated, and labelled as such everywhere.">
          <ul className="space-y-4">
            {limits.map(([area, now, next]) => (
              <li key={area} className="space-y-3 rounded-2xl bg-surface p-5 ring-1 ring-line">
                <h3 className="font-semibold">{area}</h3>
                <div className="grid gap-3 text-[15px] md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Badge tone="warn">In this build</Badge>
                    <p className="text-ink-2">{now}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Badge tone="info">Needed for production</Badge>
                    <p className="text-ink-2">{next}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
