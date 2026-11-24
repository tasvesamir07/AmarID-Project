/** The "Continue with AmarID" button a partner places on its sign-in screen. */
export function AmarIdButton({ href, label = "Continue with AmarID" }: { href: string; label?: string }) {
  return (
    <a href={href} className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-amarid px-5 text-[15px] font-medium text-white transition-colors hover:bg-amarid-strong">
      <span lang="bn" aria-hidden className="relative grid size-7 place-items-center rounded-md bg-white/15 text-sm font-semibold ring-1 ring-white/25">
        আ<span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-[#d8342b]" />
      </span>
      {label}
    </a>
  );
}
