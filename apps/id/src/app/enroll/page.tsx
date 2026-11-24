import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FlowPage } from "@/components/site-chrome";
import { getT } from "@/lib/i18n/server";
import { getEnrollment } from "@/server/enrollment";
import { env } from "@/server/env";
import { getSession } from "@/server/session";
import { EnrollFlow } from "./enroll-flow";

export const metadata: Metadata = { title: "Create your AmarID" };

export default async function EnrollPage() {
  if (await getSession()) redirect("/wallet");
  const { t } = await getT();
  const enrollment = await getEnrollment();
  const initial = enrollment && enrollment.state !== "ISSUED" && enrollment.state !== "REJECTED" ? { state: enrollment.state, name: enrollment.name, docType: enrollment.docType, phone: enrollment.phone } : null;

  return (
    <FlowPage exit={<Link href="/signin" className="text-sm font-medium text-ink-2 hover:text-ink">{t.enroll.haveOne}</Link>}>
      <EnrollFlow initial={initial} sandbox={env().sandbox} partnersUrl={env().partnersUrl} />
    </FlowPage>
  );
}
