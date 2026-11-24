import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-4 px-4 py-20">
      <p className="text-sm font-semibold uppercase tracking-wider text-amarid">Page not found</p>
      <h1 className="text-3xl font-semibold">This demo page does not exist.</h1>
      <p className="text-ink-2">The demos were renamed. Pick one from the list to continue.</p>
      <Link href="/" className="inline-flex h-12 items-center rounded-xl bg-amarid px-5 font-medium text-white hover:bg-amarid-strong">See the three demos</Link>
    </main>
  );
}
