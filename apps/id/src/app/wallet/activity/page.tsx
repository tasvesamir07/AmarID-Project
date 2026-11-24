import { Link2 } from "lucide-react";
import { Card } from "@/components/ui";
import { getT } from "@/lib/i18n/server";
import { walletData } from "@/server/me";
import { requireSession } from "@/server/session";
import { ActivityList } from "../activity-list";
import { PageHeading } from "../page-heading";

export default async function ActivityPage() {
  const { t, locale } = await getT();
  const data = await walletData(await requireSession());
  return (
    <div className="space-y-6">
      <PageHeading title={t.activity.title} body={t.activity.body} />
      <Card className="px-5">
        <ActivityList events={data.activity} t={t} locale={locale} />
      </Card>
      <p className="flex gap-2.5 text-sm text-ink-3">
        <Link2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t.activity.tamper}
      </p>
    </div>
  );
}
