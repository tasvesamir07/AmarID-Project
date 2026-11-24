import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getT } from "@/lib/i18n/server";
import { env } from "@/server/env";
import { Verifier } from "./verifier";

export const metadata: Metadata = { title: "Verify a pass" };

export default async function VerifyPage() {
  const { t } = await getT();
  const base = env().appUrl;
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">{t.verify.title}</h1>
          <p className="text-lg text-ink-2">{t.verify.body}</p>
        </div>
        <Verifier />
        <section aria-labelledby="verify-api" className="space-y-3 border-t border-line pt-8">
          <h2 id="verify-api" className="text-lg font-semibold">{t.verify.apiTitle}</h2>
          <p className="text-ink-2">{t.verify.apiBody}</p>
          <pre className="overflow-x-auto rounded-xl bg-ink p-4 text-[13px] leading-relaxed text-white/90"><code>{`curl -X POST ${base}/api/passes/check \\
  -H "Content-Type: application/json" \\
  -d '{"token":"<pass token>"}'

# Offline: verify the ES256 signature with the keys at
# ${base}/oauth/jwks  (header typ: amarid-pass+jwt)`}</code></pre>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
