import { Clock, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SignInPanel } from "@/components/sign-in-panel";
import { FlowPage } from "@/components/site-chrome";
import { ButtonLink } from "@/components/ui";
import { fmt, formatDate } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";
import { SCOPE_INFO } from "@/lib/scopes";
import { maskUniversalId } from "@/lib/universal-id";
import { profileOf } from "@/server/identity";
import { claimsFor } from "@/server/oidc/claims";
import { activeGrant, grantCovers, loadAuthorization, sessionIsFreshEnough } from "@/server/oidc/provider";
import { getSession } from "@/server/session";
import { ConsentForm, type ConsentItem } from "./consent-form";

export const metadata: Metadata = { title: "Sign in to a partner", robots: { index: false } };

function Message({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="animate-rise space-y-5 pt-10 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-sunken text-ink-2">{icon}</span>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-ink-2">{body}</p>
      {action}
    </div>
  );
}

export default async function AuthorizePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await getT();
  const pending = await loadAuthorization(id);

  if (!pending) {
    return (
      <FlowPage>
        <Message icon={<Clock className="size-8" aria-hidden />} title={t.consent.expiredTitle} body={t.consent.expiredBody} />
      </FlowPage>
    );
  }

  const { client, request } = pending;
  const auth = await getSession();

  if (!auth || !sessionIsFreshEnough(pending, auth)) {
    return (
      <FlowPage>
        <div className="animate-rise space-y-7 pt-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-brand">{fmt(t.consent.signInFor, { partner: client.name })}</p>
            <h1 className="text-2xl font-semibold sm:text-[1.7rem]">{auth ? t.consent.confirmTitle : t.signIn.title}</h1>
            <p className="text-ink-2">{auth ? t.consent.confirmBody : t.signIn.body}</p>
          </div>
          <SignInPanel next={`/authorize/${id}`} />
        </div>
      </FlowPage>
    );
  }

  if (auth.identity.status !== "ACTIVE") {
    return (
      <FlowPage>
        <Message
          icon={<ShieldAlert className="size-8" aria-hidden />}
          title={t.consent.dormantTitle}
          body={fmt(t.consent.dormantBody, { partner: client.name })}
          action={<ButtonLink href={`/wallet/renew?next=${encodeURIComponent(`/authorize/${id}`)}`} size="lg">{t.wallet.renewNow}</ButtonLink>}
        />
      </FlowPage>
    );
  }

  const profile = profileOf(auth.identity);
  const claims = await claimsFor(auth.identity, client, request.scopes);
  const grant = await activeGrant(auth.identity.id, client);
  const yesNo = (v: unknown) => (v ? t.common.yes : t.common.no);

  const valueOf: Record<string, string> = {
    openid: fmt(t.consent.values.openid, { id: `${String(claims.sub).slice(0, 8)}…` }),
    age: fmt(t.consent.values.age, { answer: yesNo(claims.age_over_18) }),
    profile: profile.name,
    birthdate: formatDate(`${profile.dob}T00:00:00+06:00`, locale),
    phone: String(claims.phone_number ?? ""),
    kyc: t.consent.values.kyc,
  };
  const items: ConsentItem[] = request.scopes.map((scope) => ({
    scope,
    required: !!SCOPE_INFO[scope].required,
    granted: !!grant?.scopes.includes(scope),
    value: valueOf[scope] ?? "",
  }));

  return (
    <FlowPage>
      <ConsentForm
        requestId={id}
        partner={{ name: client.name, category: client.category, host: new URL(request.redirectUri).host, verified: client.verified }}
        person={{ name: profile.name, maskedId: maskUniversalId(profile.universalId) }}
        items={items}
        returning={grantCovers(grant, request.scopes) && request.prompt !== "consent"}
      />
    </FlowPage>
  );
}
