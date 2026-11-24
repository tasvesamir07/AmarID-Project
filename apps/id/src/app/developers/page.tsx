import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge } from "@/components/ui";
import { SCOPE_INFO, SCOPES } from "@/lib/scopes";
import { env } from "@/server/env";

export const metadata: Metadata = { title: "Developers" };

const scopeText: Record<string, string> = {
  openid: "Sign-in. A pairwise subject, plus the facts that the person is real, unique and when they last passed a live check.",
  age: "Whether the person is 18 or older. A boolean — not the birth date.",
  profile: "Full name as on the verified document.",
  birthdate: "Date of birth (YYYY-MM-DD).",
  phone: "The verified mobile number.",
  kyc: "A verified_claims object (OpenID Connect for Identity Assurance): what was verified, how and when. No document number or image.",
};

function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-xl bg-ink p-4 text-[13px] leading-relaxed text-white/90"><code>{children}</code></pre>;
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id} className="text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function DevelopersPage() {
  const issuer = env().appUrl;
  return (
    <>
      <SiteHeader />
      <main id="main" lang="en" className="mx-auto w-full max-w-3xl flex-1 space-y-12 px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold sm:text-4xl">Add “Continue with AmarID”</h1>
          <p className="text-lg text-ink-2">
            AmarID is a standard OpenID Connect provider. If your stack can do “Sign in with Google”, it can do this — with any certified OIDC client library, and no AmarID SDK.
          </p>
        </div>

        <Section id="endpoints" title="Endpoints">
          <p className="text-ink-2">Everything is discoverable from one URL:</p>
          <Code>{`${issuer}/.well-known/openid-configuration`}</Code>
          <ul className="list-disc space-y-1.5 pl-5 text-ink-2">
            <li>Authorization code flow. <strong className="text-ink">PKCE (S256) is required</strong> for every client.</li>
            <li>Redirect URIs must match a registered URI exactly.</li>
            <li>ID tokens are signed with ES256; keys are published at <code className="font-mono text-sm">/oauth/jwks</code>.</li>
            <li>Subjects are <strong className="text-ink">pairwise</strong>: the same person has a different <code className="font-mono text-sm">sub</code> at every partner.</li>
            <li>Authorization codes are single use and live for 60 seconds. Access tokens live for 10 minutes and stop working the moment the person withdraws consent.</li>
          </ul>
        </Section>

        <Section id="scopes" title="Scopes and claims">
          <p className="text-ink-2">Ask for the least you need. The person sees each scope on the consent screen and can switch off any that is not required.</p>
          <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
            <table className="w-full text-left text-[15px]">
              <thead className="bg-sunken text-sm text-ink-3">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Scope</th>
                  <th scope="col" className="px-4 py-3 font-medium">Claims</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">What it means</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line align-top">
                {SCOPES.map((scope) => (
                  <tr key={scope}>
                    <th scope="row" className="space-y-1.5 px-4 py-3.5">
                      <code className="font-mono text-sm">{scope}</code>
                      {SCOPE_INFO[scope].regulated && <Badge tone="warn" className="block w-fit">regulated partners</Badge>}
                    </th>
                    <td className="px-4 py-3.5 font-mono text-[13px] text-ink-2">{SCOPE_INFO[scope].claims.join(", ")}</td>
                    <td className="hidden px-4 py-3.5 text-ink-2 sm:table-cell">{scopeText[scope]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="example" title="Example (Node.js, openid-client)">
          <Code>{`import * as oidc from "openid-client";

const config = await oidc.discovery(
  new URL("${issuer}"), CLIENT_ID, CLIENT_SECRET,
);

// 1. Send the person to AmarID
const verifier = oidc.randomPKCECodeVerifier();
const url = oidc.buildAuthorizationUrl(config, {
  redirect_uri: "https://your.app/callback",
  scope: "openid age",
  code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
  code_challenge_method: "S256",
  state: oidc.randomState(),
  nonce: oidc.randomNonce(),
});

// 2. Back on your callback
const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
  pkceCodeVerifier: verifier, expectedState: state, expectedNonce: nonce,
});
const claims = tokens.claims();
// claims.sub          → your stable, private id for this person
// claims.age_over_18  → true
// claims.amarid_unique → true: one real person, however many SIMs they own`}</Code>
        </Section>

        <Section id="sybil" title="One person, one account">
          <p className="text-ink-2">
            Because <code className="font-mono text-sm">sub</code> is stable per person and a person can hold only one AmarID, keying your accounts, coupons or referral rewards on <code className="font-mono text-sm">sub</code> gives you one-per-person limits without collecting a single document. A different phone number or email does not produce a different <code className="font-mono text-sm">sub</code>.
          </p>
        </Section>

        <Section id="register" title="Get a client">
          <p className="text-ink-2">
            In this sandbox, clients are registered in the <a href="/admin" className="font-medium text-brand underline-offset-4 hover:underline">operator console</a>. The client secret is shown once and stored only as a hash. The two demo partners in the repository (<code className="font-mono text-sm">apps/partners</code>) are complete, runnable integrations to copy from.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
