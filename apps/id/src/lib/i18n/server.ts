import { cookies } from "next/headers";
import { dictionaries, isLocale, LOCALE_COOKIE, type Dictionary, type Locale } from "./index";

/**
 * The person's chosen language, else Bangla.
 *
 * The browser's language is not used as a signal: most phones in Bangladesh are
 * set to English whatever their owner reads most easily, so it would hide the
 * Bangla interface from the people who need it. English is one tap away.
 */
export async function getLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(chosen) ? chosen : "bn";
}

export async function getT(): Promise<{ t: Dictionary; locale: Locale }> {
  const locale = await getLocale();
  return { t: dictionaries[locale], locale };
}
