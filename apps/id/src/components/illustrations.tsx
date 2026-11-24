// Drawings for the four things a person does to get an AmarID. They carry the
// meaning on their own, so someone who reads slowly can still follow each step.
// All are decorative for screen readers: the text beside them says the same.

const frame = "h-auto w-full max-w-[15rem]";

/** A national ID card with the place of the number marked. */
export function NidArt({ className = frame }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 150" className={className} aria-hidden>
      <rect x="14" y="12" width="212" height="126" rx="12" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="2" />
      <path d="M14 24a12 12 0 0 1 12-12h188a12 12 0 0 1 12 12v14H14z" fill="var(--color-brand)" />
      <circle cx="34" cy="25" r="6" fill="var(--color-flag)" />
      <rect x="48" y="21" width="70" height="8" rx="4" fill="#ffffff" opacity=".85" />
      <rect x="28" y="50" width="50" height="58" rx="6" fill="var(--color-sunken)" />
      <circle cx="53" cy="72" r="10" fill="var(--color-line-strong)" />
      <path d="M35 108c2-13 9-19 18-19s16 6 18 19z" fill="var(--color-line-strong)" />
      <rect x="90" y="52" width="92" height="8" rx="4" fill="var(--color-line-strong)" />
      <rect x="90" y="68" width="66" height="7" rx="3.5" fill="var(--color-line)" />
      <rect x="90" y="82" width="78" height="7" rx="3.5" fill="var(--color-line)" />
      <rect x="86" y="98" width="128" height="28" rx="8" fill="var(--color-warn-soft)" stroke="var(--color-flag)" strokeWidth="2.5" />
      <text x="150" y="117" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="14" fontWeight="600" fill="var(--color-ink)" letterSpacing="1">
        123 456 7890
      </text>
    </svg>
  );
}

/** A phone receiving a six-digit code by SMS. */
export function SmsArt({ className = frame }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 150" className={className} aria-hidden>
      <rect x="78" y="8" width="84" height="134" rx="14" fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth="3" />
      <rect x="108" y="15" width="24" height="5" rx="2.5" fill="var(--color-ink)" />
      <path d="M90 44a8 8 0 0 1 8-8h44a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8h-34l-10 9v-9a8 8 0 0 1-8-8z" fill="var(--color-brand-soft)" />
      <rect x="98" y="46" width="34" height="5" rx="2.5" fill="var(--color-brand)" opacity=".45" />
      <text x="120" y="68" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="13" fontWeight="700" fill="var(--color-brand-strong)" letterSpacing="1.5">
        482 913
      </text>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={89 + i * 10.6} y="100" width="8.6" height="13" rx="2.5" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.6" />
      ))}
      <rect x="178" y="56" width="40" height="52" rx="7" fill="var(--color-warn-soft)" stroke="var(--color-warn)" strokeWidth="2" />
      <path d="M178 70l12-14" stroke="var(--color-warn)" strokeWidth="2" />
      <rect x="187" y="76" width="22" height="20" rx="3" fill="none" stroke="var(--color-warn)" strokeWidth="2" />
      <path d="M198 76v20M187 86h22" stroke="var(--color-warn)" strokeWidth="1.6" />
      <path d="M166 82h8" stroke="var(--color-line-strong)" strokeWidth="2" strokeDasharray="2 3" />
    </svg>
  );
}

/** A face held inside the oval on a phone screen. */
export function FaceArt({ className = frame }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 150" className={className} aria-hidden>
      <rect x="78" y="8" width="84" height="134" rx="14" fill="var(--color-brand-deep)" stroke="var(--color-ink)" strokeWidth="3" />
      <ellipse cx="120" cy="72" rx="28" ry="36" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="5 5" />
      <path d="M100 66c0-16 9-24 20-24s20 8 20 24" fill="#2b2b2b" />
      <ellipse cx="120" cy="72" rx="17" ry="21" fill="#d9a77a" />
      <path d="M102 68c1-12 8-18 18-18s17 6 18 18c-5-7-11-9-18-9s-13 2-18 9z" fill="#2b2b2b" />
      <circle cx="113" cy="72" r="2" fill="#2b2b2b" />
      <circle cx="127" cy="72" r="2" fill="#2b2b2b" />
      <path d="M113 82q7 6 14 0" fill="none" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
      <path d="M96 138c2-18 11-26 24-26s22 8 24 26z" fill="#7ee0b0" opacity=".9" />
      <circle cx="182" cy="40" r="15" fill="var(--color-brand)" />
      <path d="M175 40l5 5 9-10" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 60l12 6-12 6M40 84l12 6-12 6" fill="none" stroke="var(--color-line-strong)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A thumb on a phone: the phone's own lock opens the ID. */
export function LockArt({ className = frame }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 150" className={className} aria-hidden>
      <rect x="78" y="8" width="84" height="134" rx="14" fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth="3" />
      <rect x="108" y="15" width="24" height="5" rx="2.5" fill="var(--color-ink)" />
      <circle cx="120" cy="80" r="30" fill="var(--color-brand-soft)" />
      <g fill="none" stroke="var(--color-brand)" strokeWidth="2.6" strokeLinecap="round">
        <path d="M104 86c-2-14 5-24 16-24s18 9 16 22" />
        <path d="M110 92c-3-13 2-22 10-22s12 7 10 18c-1 5-3 9-5 12" />
        <path d="M117 96c-2-8-1-18 3-18s5 6 3 14" />
        <path d="M106 74c3-5 8-8 14-8" opacity=".5" />
      </g>
      <rect x="170" y="62" width="40" height="34" rx="7" fill="var(--color-brand)" />
      <path d="M179 62v-8a11 11 0 0 1 22 0v8" fill="none" stroke="var(--color-brand)" strokeWidth="4" />
      <circle cx="190" cy="78" r="4" fill="#ffffff" />
      <path d="M190 80v7" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** An app asks; the person holds the answer. Used on the consent idea. */
export function AllowArt({ className = frame }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 150" className={className} aria-hidden>
      <rect x="22" y="34" width="78" height="82" rx="12" fill="var(--color-sunken)" stroke="var(--color-line-strong)" strokeWidth="2" />
      <rect x="34" y="48" width="54" height="8" rx="4" fill="var(--color-line-strong)" />
      <rect x="34" y="64" width="38" height="7" rx="3.5" fill="var(--color-line)" />
      <text x="61" y="100" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--color-ink-3)">?</text>
      <path d="M108 75h24" stroke="var(--color-brand)" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
      <rect x="140" y="20" width="78" height="110" rx="14" fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth="3" />
      <rect x="152" y="38" width="54" height="16" rx="6" fill="var(--color-brand-soft)" />
      <path d="M158 46l4 4 7-8" fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="152" y="60" width="54" height="16" rx="6" fill="var(--color-brand-soft)" />
      <path d="M158 68l4 4 7-8" fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="152" y="94" width="54" height="22" rx="8" fill="var(--color-brand)" />
      <path d="M172 105l5 5 9-10" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
