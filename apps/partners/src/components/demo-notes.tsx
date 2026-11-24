import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The part of each page that is about AmarID rather than the partner. It is
 * styled as AmarID's, so nobody mistakes it for the partner's own interface.
 */
export function DemoNotes({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section aria-labelledby="demo-notes" className="space-y-4 rounded-3xl border border-amarid/20 bg-amarid-paper p-5 text-ink sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span lang="bn" aria-hidden className="relative grid size-8 place-items-center rounded-lg bg-amarid text-sm font-semibold text-white">
            আ<span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#ff6b61]" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amarid">Behind the demo</p>
            <h2 id="demo-notes" className="text-lg font-semibold leading-tight">{title}</h2>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-center gap-2 rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad">
      <CircleAlert className="size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

/** Two pairwise IDs side by side: the same person, unlinkable across partners. */
export function Unlinkable({ here, there }: { here: { site: string; sub: string }; there: { site: string; sub: string } }) {
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-white p-5">
      <h3 className="font-semibold">Same person, two unlinkable IDs</h3>
      <p className="text-sm text-ink-2">
        You are also signed in to {there.site} in this browser. AmarID gave each business a different ID for you, so they cannot combine their records.
      </p>
      <dl className="grid gap-3 font-mono text-[13px] sm:grid-cols-2">
        {[here, there].map((x) => (
          <div key={x.site} className="rounded-xl bg-amarid-soft p-3">
            <dt className="font-sans text-xs font-semibold text-amarid-strong">Your ID at {x.site}</dt>
            <dd className="break-all">{x.sub}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
