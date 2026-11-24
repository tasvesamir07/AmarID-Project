import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { FlowPage } from "@/components/site-chrome";
import { ButtonLink } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Sign-in request refused", robots: { index: false } };

/**
 * Shown instead of redirecting when a sign-in link cannot be trusted (unknown
 * application, or a return address the application never registered).
 */
export default async function AuthorizeErrorPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { t } = await getT();
  const reason = (await searchParams).reason?.slice(0, 300);
  return (
    <FlowPage>
      <div className="animate-rise space-y-5 pt-10 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-danger-soft text-danger">
          <ShieldAlert className="size-8" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold">{t.consent.refusedTitle}</h1>
        <p className="text-ink-2">{t.consent.refusedBody}</p>
        {reason && <p className="rounded-xl bg-sunken px-4 py-3 text-left font-mono text-sm text-ink-2">{reason}</p>}
        <ButtonLink href="/" variant="secondary">{t.common.home}</ButtonLink>
      </div>
    </FlowPage>
  );
}
