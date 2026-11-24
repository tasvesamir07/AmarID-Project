import { safeNext } from "@/lib/safe-next";
import { RenewFlow } from "./renew-flow";

export default async function RenewPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <div className="mx-auto max-w-md">
      <RenewFlow next={safeNext((await searchParams).next)} />
    </div>
  );
}
