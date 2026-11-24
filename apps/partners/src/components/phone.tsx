import { BatteryFull, Signal, Wifi } from "lucide-react";
import type { ReactNode } from "react";

/**
 * A phone frame for app-style demos. On a real phone the frame disappears and
 * the screen fills the width, so the demo feels like the app itself.
 */
export function Phone({ children, statusTone = "dark" }: { children: ReactNode; statusTone?: "dark" | "light" }) {
  return (
    <div className="mx-auto w-full overflow-hidden bg-white sm:max-w-[392px] sm:rounded-[2.75rem] sm:border-[11px] sm:border-neutral-900 sm:shadow-[0_30px_60px_-20px_rgb(0_0_0/0.45)]">
      <div className="relative flex min-h-[720px] flex-col">
        <div aria-hidden className={`absolute inset-x-0 top-0 z-10 hidden h-9 items-center justify-between px-6 text-xs font-semibold sm:flex ${statusTone === "light" ? "text-white" : "text-ink"}`}>
          <span className="tabular-nums">9:41</span>
          <span className="flex items-center gap-1.5">
            <Signal className="size-3.5" />
            <Wifi className="size-3.5" />
            <BatteryFull className="size-4" />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
