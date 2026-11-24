import { clsx } from "clsx";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------

/** The mark: "আ" (the first letter of আমার, "my") with the flag's red sun. */
export function Logo({ size = "md", wordmark = true, compact = false }: { size?: "sm" | "md" | "lg"; wordmark?: boolean; compact?: boolean }) {
  const box = { sm: "size-7 text-[15px] rounded-lg", md: "size-9 text-[19px] rounded-[10px]", lg: "size-12 text-[26px] rounded-xl" }[size];
  const dot = { sm: "size-1.5", md: "size-2", lg: "size-2.5" }[size];
  const word = { sm: "text-[15px]", md: "text-lg", lg: "text-2xl" }[size];
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={clsx("relative grid place-items-center bg-brand font-semibold text-white", box)} lang="bn" aria-hidden>
        আ
        <span className={clsx("absolute right-1 top-1 rounded-full bg-flag", dot)} />
      </span>
      {wordmark && (
        <span className={clsx("font-semibold tracking-tight text-ink", word, compact && "max-sm:hidden")} lang="en">
          Amar<span className="text-brand">ID</span>
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-[background,box-shadow,transform,color] duration-150 select-none disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.985]";
const buttonVariant: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] hover:bg-brand-strong",
  secondary: "bg-surface text-ink ring-1 ring-inset ring-line-strong hover:bg-sunken",
  ghost: "text-ink-2 hover:bg-sunken hover:text-ink",
  danger: "bg-surface text-danger ring-1 ring-inset ring-danger/30 hover:bg-danger-soft",
};
const buttonSize: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-6 text-[17px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", block = false) {
  return clsx(buttonBase, buttonVariant[variant], buttonSize[size], block && "w-full");
}

export function Button({
  variant = "primary",
  size = "md",
  block,
  loading,
  children,
  className,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; block?: boolean; loading?: boolean }) {
  return (
    <button type="button" {...rest} disabled={disabled || loading} aria-busy={loading || undefined} className={clsx(buttonClass(variant, size, block), className)}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant = "primary", size = "md", block, className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; block?: boolean }) {
  return <Link {...rest} className={clsx(buttonClass(variant, size, block), className)} />;
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({ className, children, as: Tag = "div" }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" | "li" }) {
  return <Tag className={clsx("rounded-(--radius-card) bg-surface shadow-(--shadow-card) ring-1 ring-line", className)}>{children}</Tag>;
}

type Tone = "neutral" | "brand" | "warn" | "danger" | "info";
const badgeTone: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-2",
  brand: "bg-brand-soft text-brand-strong",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", badgeTone[tone], className)}>{children}</span>;
}

const noticeTone = {
  info: { box: "bg-info-soft text-info", icon: Info },
  success: { box: "bg-brand-soft text-brand-strong", icon: CheckCircle2 },
  warn: { box: "bg-warn-soft text-warn", icon: AlertTriangle },
  error: { box: "bg-danger-soft text-danger", icon: XCircle },
} as const;

export function Notice({ tone = "info", title, children, className }: { tone?: keyof typeof noticeTone; title?: ReactNode; children?: ReactNode; className?: string }) {
  const Icon = noticeTone[tone].icon;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={clsx("flex gap-3 rounded-xl px-4 py-3 text-sm", noticeTone[tone].box, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-ink-2">{children}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------

export function Field({ label, hint, error, htmlFor, children }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[15px] font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, invalid, ...rest }: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={clsx(
        "h-12 w-full rounded-xl bg-surface px-3.5 text-base text-ink ring-1 ring-inset transition-shadow placeholder:text-ink-3/70",
        "focus:outline-none focus:ring-2 focus:ring-brand",
        invalid ? "ring-danger" : "ring-line-strong",
        className,
      )}
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx("animate-spin text-brand", className ?? "size-5")} aria-hidden />;
}

/** Two- or three-way choice rendered as a segmented control. */
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-sunken p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "h-10 rounded-lg text-sm font-medium transition-colors",
            value === o.value ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-3 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
