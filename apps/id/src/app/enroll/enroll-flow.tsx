"use client";

import { clsx } from "clsx";
import { ArrowLeft, ArrowRight, Check, Fingerprint, IdCard, ScanFace, Smartphone, UserX } from "lucide-react";
import { useCallback, useState, type FormEvent, type ReactNode } from "react";
import { CodeStep } from "@/components/code-step";
import { FaceCheck } from "@/components/face-check";
import { IdentityCard } from "@/components/id-card";
import { FaceArt, LockArt, NidArt, SmsArt } from "@/components/illustrations";
import { ListenButton } from "@/components/listen-button";
import { Button, ButtonLink, Card, Field, Input, Notice, Segmented } from "@/components/ui";
import { ApiError, call } from "@/lib/api-client";
import { useErrorText, useLocale, useT } from "@/lib/i18n/client";
import { fmt, formatDate, formatNumber } from "@/lib/i18n";
import { createPasskey } from "@/lib/passkey-client";
import { isValidDob, normalizeDocNumber, normalizeMsisdn, type DocType } from "@/lib/validation";

type Enrollment = { state: "DOCUMENT_VERIFIED" | "PHONE_VERIFIED" | "FACE_VERIFIED"; name: string; docType: DocType; phone: string | null };
type Step = "details" | "code" | "face" | "device" | "done" | "blocked";

const stepOf = (e: Enrollment | null): Step => (!e ? "details" : e.state === "DOCUMENT_VERIFIED" ? "code" : e.state === "PHONE_VERIFIED" ? "face" : "device");

const ORDER: Step[] = ["details", "code", "face", "device"];
const ICONS = { details: IdCard, code: Smartphone, face: ScanFace, device: Fingerprint } as const;

export function EnrollFlow({ initial, sandbox, partnersUrl }: { initial: Enrollment | null; sandbox: boolean; partnersUrl: string }) {
  const t = useT();
  const locale = useLocale();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(initial);
  const [step, setStep] = useState<Step>(stepOf(initial));
  const [blocked, setBlocked] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ universalId: string; name: string } | null>(null);

  const advance = useCallback((e: Enrollment) => {
    setEnrollment(e);
    setStep(stepOf(e));
  }, []);

  const restart = useCallback(async () => {
    await call("DELETE", "/api/enroll").catch(() => {});
    setEnrollment(null);
    setBlocked(null);
    setStep("details");
  }, []);

  const onFaceRejected = useCallback((code: string) => {
    if (code === "DUPLICATE_PERSON" || code === "ALREADY_ENROLLED" || code === "ENROLLMENT_EXPIRED") {
      setBlocked(code);
      setStep("blocked");
      return true;
    }
    return false;
  }, []);

  const index = ORDER.indexOf(step);

  return (
    <div className="space-y-8">
      {index >= 0 && (
        <ol className="flex items-center gap-2" aria-label={t.enroll.progress}>
          {ORDER.map((s, i) => {
            const Icon = ICONS[s as keyof typeof ICONS];
            const state = i < index ? "done" : i === index ? "current" : "todo";
            return (
              <li key={s} aria-current={state === "current" ? "step" : undefined} className="flex flex-1 flex-col gap-2">
                <span className={clsx("h-1 rounded-full transition-colors", state === "todo" ? "bg-line" : "bg-brand")} />
                <span className={clsx("flex items-center gap-1.5 text-xs font-medium", state === "current" ? "text-ink" : state === "done" ? "text-brand" : "text-ink-3")}>
                  {state === "done" ? <Check className="size-3.5" aria-hidden /> : <Icon className="size-3.5" aria-hidden />}
                  <span className={clsx(state !== "current" && "max-sm:sr-only")}>{t.enroll.steps[s as keyof typeof t.enroll.steps]}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {step === "details" && <Details sandbox={sandbox} onDone={advance} />}

      {step === "code" && enrollment && (
        <section className="animate-rise space-y-6">
          <Heading title={t.enroll.code.title} art={<SmsArt />} />
          <CodeStep
            phone={enrollment.phone}
            sandbox={sandbox}
            onVerify={async (code) => advance((await call<{ enrollment: Enrollment }>("POST", "/api/enroll/code", { code })).enrollment)}
            onResend={async () => void (await call("PUT", "/api/enroll/code"))}
            footer={
              <button type="button" onClick={restart} className="text-ink-3 underline-offset-4 hover:text-ink hover:underline">
                {t.enroll.code.change}
              </button>
            }
          />
        </section>
      )}

      {step === "face" && (
        <section className="animate-rise space-y-6">
          <Heading title={t.enroll.face.title} body={t.enroll.face.body} art={<FaceArt />} listen />
          <FaceCheck endpoint="/api/enroll/liveness" onPassed={(r) => advance(r.enrollment as Enrollment)} onRejected={onFaceRejected} />
        </section>
      )}

      {step === "device" && enrollment && (
        <DeviceStep
          onIssued={(universalId) => {
            setIssued({ universalId, name: enrollment.name });
            // No router.refresh() here: the page would see the new session and redirect
            // to the wallet before the person has seen their new ID.
            setStep("done");
          }}
          onExpired={() => onFaceRejected("ENROLLMENT_EXPIRED")}
        />
      )}

      {step === "blocked" && blocked && (
        <section className="animate-rise space-y-6 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-danger-soft text-danger">
            <UserX className="size-8" aria-hidden />
          </span>
          <Heading title={t.enroll.blocked.reasons[blocked as keyof typeof t.enroll.blocked.reasons].title} body={t.enroll.blocked.reasons[blocked as keyof typeof t.enroll.blocked.reasons].body} center />
          <div className="flex flex-col gap-3">
            {blocked !== "ENROLLMENT_EXPIRED" && <ButtonLink href="/signin" size="lg">{t.nav.signIn}</ButtonLink>}
            <Button variant={blocked === "ENROLLMENT_EXPIRED" ? "primary" : "secondary"} size="lg" onClick={restart}>
              {t.enroll.blocked.startOver}
            </Button>
          </div>
        </section>
      )}

      {step === "done" && issued && (
        <section className="animate-rise space-y-7">
          <Heading title={t.enroll.done.title} body={t.enroll.done.body} />
          <IdentityCard name={issued.name} universalId={issued.universalId} issued={formatDate(new Date(), locale)} className="animate-pop" />
          <Notice tone="info" title={t.enroll.done.keepTitle}>{t.enroll.done.keepBody}</Notice>
          <div className="flex flex-col gap-3">
            <ButtonLink href="/wallet" size="lg">{t.enroll.done.openWallet}</ButtonLink>
            <a href={`${partnersUrl}/`} className="text-center text-sm font-medium text-brand underline-offset-4 hover:underline">
              {t.enroll.done.tryPartner}
            </a>
          </div>
        </section>
      )}
    </div>
  );
}

function Heading({ title, body, center, art, listen }: { title: string; body?: string; center?: boolean; art?: ReactNode; listen?: boolean }) {
  return (
    <div className={clsx("space-y-3", center && "text-center")}>
      {art && <div className="flex justify-center rounded-2xl bg-sunken/70 px-4 py-4">{art}</div>}
      <h1 className="text-[1.7rem] font-semibold leading-tight">{title}</h1>
      {body && <p className="text-ink-2">{body}</p>}
      {listen && <ListenButton text={body ? title + " " + body : title} />}
    </div>
  );
}

/** People with a Bangla keyboard type ০১২…; the registries use 012…. Accept both. */
const toLatinDigits = (value: string) => value.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));

// Which question a server answer is about, so the person lands on the field to fix.
const PART_OF_ERROR: Record<string, number> = {
  DOCUMENT_NUMBER_INVALID: 0,
  DOCUMENT_NOT_FOUND: 0,
  HOLDER_DECEASED: 0,
  NAME_INVALID: 1,
  DOB_INVALID: 1,
  DOCUMENT_MISMATCH: 1,
  PHONE_INVALID: 2,
  SIM_NOT_YOURS: 2,
};

/**
 * The details are asked one question at a time. A single long form is the
 * fastest layout for someone used to forms and the hardest for someone who is
 * not; three short screens with one decision each work for both.
 */
function Details({ sandbox, onDone }: { sandbox: boolean; onDone: (e: Enrollment) => void }) {
  const t = useT();
  const d = t.enroll.details;
  const locale = useLocale();
  const errorText = useErrorText();
  const [part, setPart] = useState(0);
  const [docType, setDocType] = useState<DocType>("NID");
  const [docNumber, setDocNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState([false, false, false]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dob = year.length === 4 && month && day ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}` : "";
  const invalid = {
    docNumber: !normalizeDocNumber(docType, docNumber),
    fullName: fullName.trim().length < 2,
    dob: !isValidDob(dob),
    phone: !normalizeMsisdn(phone),
  };
  const partInvalid = [invalid.docNumber, invalid.fullName || invalid.dob, invalid.phone || !agreed];
  const fieldError = (key: keyof typeof invalid, at: number, serverCode: string, message: string) => ((touched[at] && invalid[key]) || error === serverCode ? message : undefined);
  const fieldCodes = ["DOCUMENT_NUMBER_INVALID", "NAME_INVALID", "DOB_INVALID", "PHONE_INVALID"];

  const titles = [docType === "NID" ? d.docTitle : d.passportTitle, d.whoTitle, d.phoneTitle];
  const spoken = [`${titles[0]} ${docType === "NID" ? d.nidHint : d.passportHint}`, `${d.whoTitle}। ${d.whoBody}`, `${d.phoneTitle} ${d.phoneHint}`];

  async function next(e: FormEvent) {
    e.preventDefault();
    setTouched((was) => was.map((v, i) => v || i === part));
    setError(null);
    if (partInvalid[part]) return;
    if (part < 2) return setPart(part + 1);
    setBusy(true);
    try {
      const { enrollment } = await call<{ enrollment: Enrollment }>("POST", "/api/enroll", { docType, docNumber, fullName, dob, phone });
      onDone(enrollment);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "UNKNOWN";
      setError(code);
      setPart(PART_OF_ERROR[code] ?? 2);
    } finally {
      setBusy(false);
    }
  }

  const dobError = fieldError("dob", 1, "DOB_INVALID", t.errors.DOB_INVALID);
  const big = "h-14 text-lg";

  return (
    <form onSubmit={next} noValidate className="animate-rise space-y-6" key={part}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink-3">{fmt(d.part, { n: formatNumber(part + 1, locale), total: formatNumber(3, locale) })}</p>
          <ListenButton text={spoken[part]!} />
        </div>
        <h1 className="text-[1.7rem] font-semibold leading-tight">{titles[part]}</h1>
        {part === 0 && <p className="text-ink-2">{d.body}</p>}
        {part === 1 && <p className="text-ink-2">{d.whoBody}</p>}
      </div>

      {error && !fieldCodes.includes(error) && (
        <Notice tone="error" title={errorText(error)}>
          {(d.help as Record<string, string>)[error]}
        </Notice>
      )}

      {part === 0 && (
        <div className="space-y-5">
          <Segmented label={d.docType} value={docType} onChange={(v) => { setDocType(v); setDocNumber(""); }} options={[{ value: "NID", label: d.nid }, { value: "PASSPORT", label: d.passport }]} />
          {docType === "NID" && (
            <figure className="flex flex-col items-center gap-2 rounded-2xl bg-sunken/70 px-4 py-4">
              <NidArt />
              <figcaption className="text-center text-sm text-ink-2">{d.docWhere}</figcaption>
            </figure>
          )}
          <Field label={docType === "NID" ? d.nidNumber : d.passportNumber} htmlFor="doc" hint={docType === "NID" ? d.nidHint : d.passportHint} error={fieldError("docNumber", 0, "DOCUMENT_NUMBER_INVALID", t.errors.DOCUMENT_NUMBER_INVALID)}>
            <Input id="doc" autoFocus value={docNumber} onChange={(e) => setDocNumber(toLatinDigits(e.target.value))} inputMode={docType === "NID" ? "numeric" : "text"} autoComplete="off" autoCapitalize="characters" spellCheck={false} invalid={!!fieldError("docNumber", 0, "DOCUMENT_NUMBER_INVALID", "x")} className={clsx(big, "font-mono tracking-wider tabular")} />
          </Field>
        </div>
      )}

      {part === 1 && (
        <div className="space-y-5">
          <Field label={d.name} htmlFor="name" hint={d.nameHint} error={fieldError("fullName", 1, "NAME_INVALID", t.errors.NAME_INVALID)}>
            <Input id="name" autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" autoCapitalize="words" invalid={!!fieldError("fullName", 1, "NAME_INVALID", "x")} className={big} />
          </Field>
          <fieldset className="space-y-1.5">
            <legend className="text-[15px] font-medium text-ink">{d.dob}</legend>
            <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2.5">
              {(
                [
                  { id: "dob-day", label: d.day, value: day, set: setDay, max: 2, placeholder: "05", auto: "bday-day" },
                  { id: "dob-month", label: d.month, value: month, set: setMonth, max: 2, placeholder: "03", auto: "bday-month" },
                  { id: "dob-year", label: d.year, value: year, set: setYear, max: 4, placeholder: "1990", auto: "bday-year" },
                ] as const
              ).map((f) => (
                <div key={f.id} className="space-y-1">
                  <Input id={f.id} aria-label={`${d.dob}: ${f.label}`} value={f.value} onChange={(e) => f.set(toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, f.max))} inputMode="numeric" autoComplete={f.auto} placeholder={f.placeholder} invalid={!!dobError} className={clsx(big, "text-center tabular")} />
                  <p aria-hidden className="text-center text-sm text-ink-3">{f.label}</p>
                </div>
              ))}
            </div>
            {dobError && <p role="alert" className="text-sm text-danger">{dobError}</p>}
          </fieldset>
        </div>
      )}

      {part === 2 && (
        <div className="space-y-5">
          <Field label={d.phone} htmlFor="phone" hint={d.phoneHint} error={fieldError("phone", 2, "PHONE_INVALID", t.errors.PHONE_INVALID)}>
            <Input id="phone" autoFocus type="tel" value={phone} onChange={(e) => setPhone(toLatinDigits(e.target.value))} inputMode="tel" autoComplete="tel-national" placeholder="01XXX-XXXXXX" invalid={!!fieldError("phone", 2, "PHONE_INVALID", "x")} className={clsx(big, "font-mono tracking-wider tabular")} />
          </Field>
          <label className="flex cursor-pointer gap-3.5 rounded-2xl bg-sunken/70 p-4 text-[15px] text-ink-2">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 size-6 shrink-0 accent-(--color-brand)" />
            <span>{d.consent}</span>
          </label>
          {touched[2] && !agreed && <p role="alert" className="-mt-2 text-sm text-danger">{d.consentRequired}</p>}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button type="submit" block size="lg" loading={busy}>
          {part < 2 ? t.common.next : d.submit}
          {part < 2 && <ArrowRight className="size-5" aria-hidden />}
        </Button>
        {part > 0 && (
          <Button variant="ghost" block size="lg" onClick={() => { setError(null); setPart(part - 1); }}>
            <ArrowLeft className="size-5" aria-hidden />
            {t.common.back}
          </Button>
        )}
      </div>

      {sandbox && part === 0 && (
        <Card className="space-y-2 border-dashed p-4 text-sm text-ink-2 shadow-none">
          <p className="font-semibold text-ink">{t.sandbox.testDataTitle}</p>
          <ul className="list-disc space-y-1 pl-5">
            {t.sandbox.testData.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </Card>
      )}
    </form>
  );
}

function DeviceStep({ onIssued, onExpired }: { onIssued: (universalId: string) => void; onExpired: () => void }) {
  const t = useT();
  const errorText = useErrorText();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const { universalId } = await createPasskey<{ universalId: string }>("/api/enroll/passkey");
      onIssued(universalId);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "UNKNOWN";
      if (code === "ENROLLMENT_EXPIRED") return onExpired();
      setError(code);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="animate-rise space-y-6">
      <Heading title={t.enroll.device.title} body={t.enroll.device.body} art={<LockArt />} listen />
      <Card className="divide-y divide-line">
        {t.enroll.device.points.map((p) => (
          <div key={p.title} className="flex gap-3.5 p-4">
            <Check className="mt-0.5 size-4.5 shrink-0 text-brand" aria-hidden />
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="text-sm text-ink-3">{p.body}</p>
            </div>
          </div>
        ))}
      </Card>
      {error && error !== "PASSKEY_CANCELLED" && <Notice tone="error" title={errorText(error)} />}
      {error === "PASSKEY_CANCELLED" && <Notice tone="warn" title={t.errors.PASSKEY_CANCELLED} />}
      <Button block size="lg" loading={busy} onClick={create}>
        <Fingerprint className="size-5" aria-hidden />
        {t.enroll.device.create}
      </Button>
    </section>
  );
}
