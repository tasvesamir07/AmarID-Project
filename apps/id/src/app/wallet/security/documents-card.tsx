"use client";

import { BadgeCheck, IdCard, Plus } from "lucide-react";
import { useState } from "react";
import { AddDocument } from "@/components/add-document";
import { Button, Card } from "@/components/ui";
import { fmt } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";
import type { DocType } from "@/lib/validation";

const ALL: DocType[] = ["NID", "PASSPORT"];

/** The documents the person has verified, with a way to add the one they have not. */
export function DocumentsCard({ held }: { held: { docType: DocType; date: string }[] }) {
  const t = useT();
  const [adding, setAdding] = useState<DocType | null>(null);

  return (
    <Card className="divide-y divide-line">
      {ALL.map((docType) => {
        const have = held.find((h) => h.docType === docType);
        return (
          <div key={docType} className="space-y-4 p-5">
            <div className="flex items-center gap-3.5">
              <span className={`grid size-10 shrink-0 place-items-center rounded-full ${have ? "bg-brand-soft text-brand" : "bg-sunken text-ink-3"}`}>
                {have ? <BadgeCheck className="size-5" aria-hidden /> : <IdCard className="size-5" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{t.docs[docType]}</p>
                <p className="text-sm text-ink-3">{have ? fmt(t.docs.verifiedOn, { date: have.date }) : t.docs.notAdded}</p>
              </div>
              {!have && adding !== docType && (
                <Button size="sm" variant="secondary" onClick={() => setAdding(docType)}>
                  <Plus className="size-4" aria-hidden />
                  {t.docs.add}
                </Button>
              )}
            </div>
            {!have && adding === docType && <AddDocument docType={docType} compact onDone={() => setAdding(null)} />}
          </div>
        );
      })}
    </Card>
  );
}
