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

export function formatDateTime(value: string | Date, locale: Locale): string {
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
