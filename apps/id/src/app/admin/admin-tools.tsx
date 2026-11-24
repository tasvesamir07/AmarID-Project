"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Card, Field, Input, Notice, Segmented } from "@/components/ui";
import { call, errorCode } from "@/lib/api-client";

const messages: Record<string, string> = {
  ADMIN_TOKEN_WRONG: "That token is not correct.",
  RATE_LIMITED: "Too many attempts. Wait a few minutes.",
  REDIRECT_URI_INVALID: "Redirect URIs must be https:// (http://localhost is allowed for development) and have no #fragment.",
  DOCUMENT_NUMBER_INVALID: "That is not a valid document number.",
  INVALID_REQUEST: "Check the fields and try again.",
};
const say = (code: string) => messages[code] ?? "Something went wrong. Try again.";

export function AdminSignIn() {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await call("POST", "/api/admin/session", { token });
      window.location.reload();
    } catch (err) {
      setError(say(errorCode(err)));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Operator token" htmlFor="admin-token" error={error}>
        <Input id="admin-token" type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="current-password" invalid={!!error} />
      </Field>
      <Button type="submit" block loading={busy} disabled={!token}>Open console</Button>
    </form>
  );
}

export function AdminSignOut() {
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={async () => {
        await call("DELETE", "/api/admin/session").catch(() => {});
        window.location.reload();
      }}
    >
      Close console
    </Button>
  );
}

export function AuditVerifier() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; events: number; brokenAtSeq: string | null } | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      {result && (
        <span className={`flex items-center gap-1.5 text-sm font-medium ${result.ok ? "text-brand" : "text-danger"}`} role="status">
          {result.ok ? <CheckCircle2 className="size-4" aria-hidden /> : <XCircle className="size-4" aria-hidden />}
          {result.ok ? `Chain intact — ${result.events} events verified` : `Chain broken at event #${result.brokenAtSeq}`}
        </span>
      )}
      <Button
        size="sm"
        variant="secondary"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          setResult(await call<{ ok: boolean; events: number; brokenAtSeq: string | null }>("POST", "/api/admin/audit").catch(() => null));
          setBusy(false);
        }}
      >
        Verify chain
      </Button>
    </div>
  );
}

export function RegisterClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [redirect, setRedirect] = useState("");
  const [tier, setTier] = useState<"standard" | "regulated">("standard");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ clientId: string; clientSecret: string | null } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await call<{ clientId: string; clientSecret: string | null }>("POST", "/api/admin/clients", {
        name,
        category: tier === "regulated" ? "Regulated service" : "Service",
        redirectUris: redirect.split(/[\s,]+/).filter(Boolean),
        scopes: tier === "regulated" ? "age profile birthdate phone kyc" : "age profile",
        confidential: true,
      });
      setCreated(result);
      setName("");
      setRedirect("");
      router.refresh();
    } catch (err) {
      setError(say(errorCode(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4 p-5">
        <h3 className="font-semibold">Register a partner</h3>
        {created && (
          <Notice tone="success" title="Partner registered — copy the secret now, it is not shown again">
            <p className="mt-1 break-all font-mono text-xs">client_id: {created.clientId}</p>
            <p className="break-all font-mono text-xs">client_secret: {created.clientSecret}</p>
          </Notice>
        )}
        {error && <Notice tone="error" title={error} />}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" htmlFor="client-name">
            <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
          </Field>
          <Field label="Redirect URI" htmlFor="client-redirect" hint="Exact match. Separate several with a space.">
            <Input id="client-redirect" value={redirect} onChange={(e) => setRedirect(e.target.value)} placeholder="https://partner.example/callback" required className="font-mono text-sm" />
          </Field>
        </div>
        <div className="max-w-md space-y-1.5">
          <p className="text-sm font-medium">May request</p>
          <Segmented label="Scope tier" value={tier} onChange={setTier} options={[{ value: "standard", label: "Sign-in, age, name" }, { value: "regulated", label: "+ KYC (regulated)" }]} />
        </div>
        <Button type="submit" loading={busy} disabled={!name || !redirect}>Register</Button>
      </form>
    </Card>
  );
}

export function DeathNotice() {
  const router = useRouter();
  const [docNumber, setDocNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "info" | "error"; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const { matched } = await call<{ matched: boolean }>("POST", "/api/admin/sandbox", { docType: "NID", docNumber });
      setMessage(matched ? { tone: "success", text: "An identity was linked to this document. It is now closed and signed out everywhere." } : { tone: "info", text: "Recorded in the registry. No AmarID was linked to this document." });
      setDocNumber("");
      router.refresh();
    } catch (err) {
      setMessage({ tone: "error", text: say(errorCode(err)) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4 p-5">
        {message && <Notice tone={message.tone} title={message.text} />}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="NID number of the deceased" htmlFor="death-doc">
              <Input id="death-doc" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} inputMode="numeric" className="font-mono" />
            </Field>
          </div>
          <Button type="submit" variant="danger" loading={busy} disabled={!docNumber} className="h-12">Record notice</Button>
        </div>
      </form>
    </Card>
  );
}
