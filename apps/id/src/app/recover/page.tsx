import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safe-next";
import { FlowPage } from "@/components/site-chrome";
import { getT } from "@/lib/i18n/server";
import { env } from "@/server/env";
import { getSession } from "@/server/session";
import { RecoverFlow } from "./recover-flow";

export const metadata: Metadata = { title: "Sign in without a passkey" };

export default async function RecoverPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getSession()) redirect(next);
  const { t } = await getT();
  return (
    <FlowPage exit={<Link href={`/signin?next=${encodeURIComponent(next)}`} className="text-sm font-medium text-ink-2 hover:text-ink">{t.recover.back}</Link>}>
      <div className="pt-6">
        <RecoverFlow next={next} sandbox={env().sandbox} />
      </div>
    </FlowPage>
  );
}
