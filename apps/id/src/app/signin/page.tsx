import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInPanel } from "@/components/sign-in-panel";
import { safeNext } from "@/lib/safe-next";
import { FlowPage } from "@/components/site-chrome";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/server/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getSession()) redirect(next);
  const { t } = await getT();
  return (
    <FlowPage exit={<Link href="/enroll" className="text-sm font-medium text-ink-2 hover:text-ink">{t.signIn.create}</Link>}>
      <div className="animate-rise space-y-7 pt-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold sm:text-[1.7rem]">{t.signIn.title}</h1>
          <p className="text-ink-2">{t.signIn.body}</p>
        </div>
        <SignInPanel next={next} />
      </div>
    </FlowPage>
  );
}
