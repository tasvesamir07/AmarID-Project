import { cookies, headers } from "next/headers";
import { dictionaries, isLocale, LOCALE_COOKIE, type Dictionary, type Locale } from "./index";

/** The person's chosen language, else the browser's, else English. */
export async function getLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^\s*bn\b/i.test(accept) ? "bn" : "en";
}

export async function getT(): Promise<{ t: Dictionary; locale: Locale }> {
  const locale = await getLocale();
  return { t: dictionaries[locale], locale };
}
