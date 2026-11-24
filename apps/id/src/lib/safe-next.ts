/** Only same-site paths are accepted as a place to continue to after sign-in. */
export function safeNext(next: string | undefined | null, fallback = "/wallet"): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : fallback;
}
