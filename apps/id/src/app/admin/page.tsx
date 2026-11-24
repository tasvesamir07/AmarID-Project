import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge, Card } from "@/components/ui";
import { formatDateTime } from "@/lib/i18n";
import { isAdmin, overview } from "@/server/admin";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { AdminSignIn, AdminSignOut, AuditVerifier, DeathNotice, RegisterClient } from "./admin-tools";

export const metadata: Metadata = { title: "Operator console", robots: { index: false } };

// Staff tool, English only.

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <>
        <SiteHeader />
        <main id="main" lang="en" className="mx-auto w-full max-w-sm flex-1 space-y-6 px-4 py-16">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Operator console</h1>
            <p className="text-ink-2">For AmarID staff. Enter the operator token from the deployment configuration.</p>
          </div>
          <AdminSignIn />
        </main>
        <SiteFooter />
      </>
    );
  }

  const [stats, clients, events] = await Promise.all([
    overview(),
    db.oidcClient.findMany({ orderBy: { createdAt: "asc" } }),
    db.auditEvent.findMany({ orderBy: { seq: "desc" }, take: 25 }),
  ]);
  const tiles: [string, number, string?][] = [
    ["Active identities", stats.identities.active],
    ["Dormant", stats.identities.dormant, "Proof of life overdue"],
    ["Deceased", stats.identities.deceased, "Closed by registry notice"],
    ["Enrollments started", stats.enrollmentsStarted],
    ["Duplicates blocked", stats.duplicatesBlocked, "Same face, another document"],
    ["Partner sign-ins", stats.partnerSignIns],
    ["Active consents", stats.activeConsents],
    ["Passes issued", stats.passes],
  ];

  return (
    <>
      <SiteHeader />
      <main id="main" lang="en" className="mx-auto w-full max-w-5xl flex-1 space-y-12 px-4 py-10 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold">Operator console</h1>
            <p className="text-ink-2">Counts and events only. Operators cannot open a citizen&rsquo;s name, birth date, phone or template from here.</p>
          </div>
          <AdminSignOut />
        </div>

        <section aria-label="Overview" className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {tiles.map(([label, value, note]) => (
            <Card key={label} className="space-y-1 p-4">
              <p className="text-sm text-ink-3">{label}</p>
              <p className="text-3xl font-semibold tabular">{value}</p>
              {note && <p className="text-xs text-ink-3">{note}</p>}
            </Card>
          ))}
        </section>

        <section aria-labelledby="audit" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h2 id="audit" className="text-xl font-semibold">Activity log</h2>
              <p className="text-ink-2">Hash-chained: each event commits to the one before it. Verification recomputes every hash.</p>
            </div>
            <AuditVerifier />
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-sunken text-ink-3">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">#</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Event</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Partner</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Detail</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">When</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {events.map((e) => (
                  <tr key={e.seq.toString()}>
                    <td className="px-4 py-2.5 font-mono text-ink-3 tabular">{e.seq.toString()}</td>
                    <td className="px-4 py-2.5 font-mono">{e.type}</td>
                    <td className="px-4 py-2.5 text-ink-2">{e.clientId ?? "—"}</td>
                    <td className="max-w-56 truncate px-4 py-2.5 font-mono text-xs text-ink-3">{JSON.stringify(e.detail)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink-3">{formatDateTime(e.createdAt, "en")}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink-3">{e.hash.slice(0, 10)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        <section aria-labelledby="partners" className="space-y-4">
          <div className="space-y-1">
            <h2 id="partners" className="text-xl font-semibold">Partners</h2>
            <p className="text-ink-2">Applications allowed to request sign-in, and the most they may ask for.</p>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {clients.map((c) => (
              <Card as="li" key={c.id} className="space-y-2.5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="font-mono text-xs text-ink-3">{c.clientId}</p>
                  </div>
                  <Badge tone={c.verified ? "brand" : "neutral"}>{c.verified ? "Verified" : "Unverified"}</Badge>
                </div>
                <p className="flex flex-wrap gap-1.5">{c.allowedScopes.map((s) => <Badge key={s}>{s}</Badge>)}</p>
                <p className="break-all font-mono text-xs text-ink-3">{c.redirectUris.join(", ")}</p>
              </Card>
            ))}
          </ul>
          <RegisterClient />
        </section>

        {env().sandbox && (
          <section aria-labelledby="sandbox" className="space-y-4">
            <div className="space-y-1">
              <h2 id="sandbox" className="text-xl font-semibold">Sandbox: civil registry notice</h2>
              <p className="text-ink-2">Simulates the registry reporting a death. AmarID finds the identity through the document&rsquo;s blind index, closes it and ends its sessions.</p>
            </div>
            <DeathNotice />
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
