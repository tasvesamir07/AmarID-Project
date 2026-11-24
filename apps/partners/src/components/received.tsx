import { Check, X } from "lucide-react";

/** Shows a visitor exactly what the partner got from AmarID — and what it did not. */
export function Received({ claims, missing, site }: { claims: Record<string, unknown>; missing: string[]; site: string }) {
  const hidden = new Set(["iss", "aud", "exp", "iat", "nonce", "at_hash", "auth_time", "acr", "amr"]);
  const shown = Object.fromEntries(Object.entries(claims).filter(([k]) => !hidden.has(k)));
  return (
    <section aria-labelledby="received" className="overflow-hidden rounded-2xl border border-line bg-white">
      <h3 id="received" className="border-b border-line bg-amarid-soft px-5 py-3 text-sm font-semibold text-amarid-strong">
        Everything {site} received from AmarID
      </h3>
      <pre tabIndex={0} className="max-h-72 overflow-auto px-5 py-4 font-mono text-[13px] leading-relaxed text-ink-2">{JSON.stringify(shown, null, 2)}</pre>
      <ul className="grid gap-x-6 gap-y-1.5 border-t border-line px-5 py-4 text-sm sm:grid-cols-2">
        <li className="flex items-center gap-2 text-ok"><Check className="size-4 shrink-0" aria-hidden />Signature verified against AmarID&rsquo;s public key</li>
        {missing.map((m) => (
          <li key={m} className="flex items-center gap-2 text-ink-3"><X className="size-4 shrink-0 text-bad" aria-hidden />No {m}</li>
        ))}
      </ul>
    </section>
  );
}
