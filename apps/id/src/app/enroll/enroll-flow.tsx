"use client";

import { clsx } from "clsx";
import { Check, Fingerprint, IdCard, ScanFace, Smartphone, UserX } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { CodeStep } from "@/components/code-step";
import { FaceCheck } from "@/components/face-check";
import { IdentityCard } from "@/components/id-card";
import { Button, ButtonLink, Card, Field, Input, Notice, Segmented } from "@/components/ui";
import { ApiError, call } from "@/lib/api-client";
import { useErrorText, useLocale, useT } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n";
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
          <Heading title={t.enroll.code.title} />
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
          <Heading title={t.enroll.face.title} body={t.enroll.face.body} />
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
            <a href={`${partnersUrl}/bazar`} className="text-center text-sm font-medium text-brand underline-offset-4 hover:underline">
              {t.enroll.done.tryPartner}
            </a>
          </div>
        </section>
      )}
    </div>
  );
}

function Heading({ title, body, center }: { title: string; body?: string; center?: boolean }) {
  return (
    <div className={clsx("space-y-2", center && "text-center")}>
      <h1 className="text-2xl font-semibold sm:text-[1.7rem]">{title}</h1>
      {body && <p className="text-ink-2">{body}</p>}
    </div>
  );
}

function Details({ sandbox, onDone }: { sandbox: boolean; onDone: (e: Enrollment) => void }) {
  const t = useT();
  const errorText = useErrorText();
  const [docType, setDocType] = useState<DocType>("NID");
  const [docNumber, setDocNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalid = {
    docNumber: !normalizeDocNumber(docType, docNumber),
    fullName: fullName.trim().length < 2,
    dob: !isValidDob(dob),
    phone: !normalizeMsisdn(phone),
  };
  const fieldError = (key: keyof typeof invalid, serverCode: string, message: string) => ((touched && invalid[key]) || error === serverCode ? message : undefined);
  const fieldCodes = ["DOCUMENT_NUMBER_INVALID", "NAME_INVALID", "DOB_INVALID", "PHONE_INVALID"];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (Object.values(invalid).some(Boolean) || !agreed) return;
    setBusy(true);
    try {
      const { enrollment } = await call<{ enrollment: Enrollment }>("POST", "/api/enroll", { docType, docNumber, fullName, dob, phone });
      onDone(enrollment);
    } catch (err) {
      setError(err instanceof ApiError ? err.code : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="animate-rise space-y-6">
      <Heading title={t.enroll.details.title} body={t.enroll.details.body} />

      {error && !fieldCodes.includes(error) && (
        <Notice tone="error" title={errorText(error)}>
          {(t.enroll.details.help as Record<string, string>)[error]}
        </Notice>
      )}

      <div className="space-y-5">
        <Segmented label={t.enroll.details.docType} value={docType} onChange={(v) => { setDocType(v); setDocNumber(""); }} options={[{ value: "NID", label: t.enroll.details.nid }, { value: "PASSPORT", label: t.enroll.details.passport }]} />

        <Field label={docType === "NID" ? t.enroll.details.nidNumber : t.enroll.details.passportNumber} htmlFor="doc" hint={docType === "NID" ? t.enroll.details.nidHint : t.enroll.details.passportHint} error={fieldError("docNumber", "DOCUMENT_NUMBER_INVALID", t.errors.DOCUMENT_NUMBER_INVALID)}>
          <Input id="doc" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} inputMode={docType === "NID" ? "numeric" : "text"} autoComplete="off" autoCapitalize="characters" spellCheck={false} invalid={!!fieldError("docNumber", "DOCUMENT_NUMBER_INVALID", "x")} className="font-mono tracking-wide tabular" />
        </Field>

        <Field label={t.enroll.details.name} htmlFor="name" hint={t.enroll.details.nameHint} error={fieldError("fullName", "NAME_INVALID", t.errors.NAME_INVALID)}>
          <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" invalid={!!fieldError("fullName", "NAME_INVALID", "x")} />
        </Field>

        <Field label={t.enroll.details.dob} htmlFor="dob" error={fieldError("dob", "DOB_INVALID", t.errors.DOB_INVALID)}>
          <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} autoComplete="bday" max={new Date().toISOString().slice(0, 10)} min="1900-01-01" invalid={!!fieldError("dob", "DOB_INVALID", "x")} />
        </Field>

        <Field label={t.enroll.details.phone} htmlFor="phone" hint={t.enroll.details.phoneHint} error={fieldError("phone", "PHONE_INVALID", t.errors.PHONE_INVALID)}>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-3 tabular" aria-hidden>+880</span>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel-national" placeholder="1XXX-XXXXXX" invalid={!!fieldError("phone", "PHONE_INVALID", "x")} className="pl-16 tabular" />
          </div>
        </Field>
      </div>

      <label className="flex cursor-pointer gap-3 rounded-xl bg-sunken/70 p-4 text-sm text-ink-2">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 size-4.5 shrink-0 accent-(--color-brand)" />
        <span>{t.enroll.details.consent}</span>
      </label>
      {touched && !agreed && <p role="alert" className="-mt-3 text-sm text-danger">{t.enroll.details.consentRequired}</p>}

      <Button type="submit" block size="lg" loading={busy}>{t.enroll.details.submit}</Button>

      {sandbox && (
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
      <Heading title={t.enroll.device.title} body={t.enroll.device.body} />
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
