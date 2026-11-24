"use client";

import { createContext, useContext, type ReactNode } from "react";
import { dictionaries, type Dictionary, type Locale } from "./index";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT(): Dictionary {
  return dictionaries[useContext(LocaleContext)];
}

/** Turns an API error code into a sentence in the person's language. */
export function useErrorText(): (code: string | undefined) => string {
  const t = useT();
  return (code) => (code && (t.errors as Record<string, string>)[code]) || t.errors.UNKNOWN;
}
