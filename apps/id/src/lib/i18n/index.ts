import { bn } from "./bn";
import { en, type Dictionary } from "./en";

export type Locale = "en" | "bn";
export type { Dictionary };

export const LOCALES: Locale[] = ["en", "bn"];
export const LOCALE_COOKIE = "amarid_lang";

export const dictionaries: Record<Locale, Dictionary> = { en, bn };

export const isLocale = (value: string | undefined): value is Locale => value === "en" || value === "bn";

/** Replaces {name} placeholders. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

const intlLocale = (locale: Locale) => (locale === "bn" ? "bn-BD" : "en-GB");

export function formatDate(value: string | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" }).format(new Date(value));
}

/** In Bangla people say "রাত ৮:৪৯", not "৮:৪৯ PM". */
function banglaDayPart(hour: number): string {
  if (hour < 4) return "রাত";
  if (hour < 12) return "সকাল";
  if (hour < 16) return "দুপুর";
  if (hour < 18) return "বিকেল";
  if (hour < 20) return "সন্ধ্যা";
  return "রাত";
}

export function formatDateTime(value: string | Date, locale: Locale): string {
  if (locale === "bn") {
    const date = new Date(value);
    const day = new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "short", timeZone: "Asia/Dhaka" }).format(date);
    const hour24 = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Dhaka" }).format(date));
    const minute = new Intl.DateTimeFormat("en-GB", { minute: "2-digit", timeZone: "Asia/Dhaka" }).format(date).padStart(2, "0");
    const clock = new Intl.NumberFormat("bn-BD").format(hour24 % 12 || 12) + ":" + minute.replace(/d/g, (n) => "০১২৩৪৫৬৭৮৯"[Number(n)]!);
    return day + ", " + banglaDayPart(hour24) + " " + clock;
  }
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" }).format(new Date(value));
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}

/** "in 3 days", "2 hours ago" — coarse on purpose. */
export function formatRelative(value: string | Date, locale: Locale, now = Date.now()): string {
  const diff = new Date(value).getTime() - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31_536_000_000], ["month", 2_592_000_000], ["day", 86_400_000], ["hour", 3_600_000], ["minute", 60_000]];
  for (const [unit, ms] of units) if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  return rtf.format(0, "minute");
}
