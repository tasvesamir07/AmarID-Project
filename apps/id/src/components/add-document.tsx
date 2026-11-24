"use client";

import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { NidArt } from "@/components/illustrations";
import { Button, Field, Input, Notice } from "@/components/ui";
import { ApiError, call } from "@/lib/api-client";
import { fmt } from "@/lib/i18n";
import { useErrorText, useT } from "@/lib/i18n/client";
import { normalizeDocNumber, type DocType } from "@/lib/validation";

const toLatinDigits = (value: string) => value.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));

/**
 * Verifies one more document for the signed-in person. Only the number is
 * asked: the name and date of birth must match the ones already on the AmarID.
 */
export function AddDocument({ docType, onDone, compact }: { docType: DocType; onDone?: () => void; compact?: boolean }) {
  const t = useT();
  const errorText = useErrorText();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doc = t.docs[docType];
  const invalid = !normalizeDocNumber(docType, value);
  const d = t.enroll.details;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (invalid) return;
    setBusy(true);
    try {
      await call("POST", "/api/me/documents", { docType, docNumber: value });
      onDone?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.code : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (touched && invalid) || error === "DOCUMENT_NUMBER_INVALID" ? t.errors.DOCUMENT_NUMBER_INVALID : undefined;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {error && error !== "DOCUMENT_NUMBER_INVALID" && (
        <Notice tone="error" title={errorText(error)}>
          {(d.help as Record<string, string>)[error]}
        </Notice>
      )}
      {docType === "NID" && !compact && (
        <figure className="flex flex-col items-center gap-2 rounded-2xl bg-sunken/70 px-4 py-4">
          <NidArt />
          <figcaption className="text-center text-sm text-ink-2">{d.docWhere}</figcaption>
        </figure>
      )}
      <Field label={docType === "NID" ? d.nidNumber : d.passportNumber} htmlFor={`add-${docType}`} hint={`${docType === "NID" ? d.nidHint : d.passportHint} ${t.docs.match}`} error={fieldError}>
        <Input
          id={`add-${docType}`}
          value={value}
          onChange={(e) => setValue(toLatinDigits(e.target.value))}
          inputMode={docType === "NID" ? "numeric" : "text"}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          invalid={!!fieldError}
          className={clsx("h-14 text-lg font-mono tracking-wider tabular")}
        />
      </Field>
      <Button type="submit" block size="lg" loading={busy}>{fmt(t.docs.submit, { doc })}</Button>
    </form>
  );
}
