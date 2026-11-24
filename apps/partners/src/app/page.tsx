import { ArrowRight, Landmark, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { env } from "@/lib/env";

export default function Index() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-14">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">AmarID demo partners</h1>
        <p className="text-lg text-ink-2">
          Two fictional businesses. Each is a relying party of <a href={env.issuer} className="font-medium text-amarid underline-offset-4 hover:underline">AmarID</a>, integrated with a standard OpenID Connect library.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Link href="/bazar" className="group space-y-3 rounded-2xl border border-line bg-bazar-paper p-6 transition-shadow hover:shadow-lg">
          <ShoppingBag className="size-8 text-bazar" aria-hidden />
          <h2 className="text-xl font-semibold">Bazar Local</h2>
          <p className="text-ink-2">A shop with a one-per-customer coupon. Try to claim it twice.</p>
          <span className="inline-flex items-center gap-1.5 font-medium text-bazar">Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
        </Link>
        <Link href="/bank" className="group space-y-3 rounded-2xl border border-line bg-bank-paper p-6 transition-shadow hover:shadow-lg">
          <Landmark className="size-8 text-bank" aria-hidden />
          <h2 className="text-xl font-semibold">Probashi Bank</h2>
          <p className="text-ink-2">Open an account without uploading a single document.</p>
          <span className="inline-flex items-center gap-1.5 font-medium text-bank">Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
        </Link>
      </div>
    </main>
  );
}
