"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  dictionaries,
  type Dictionary,
  type Locale,
} from "@/lib/i18n/dictionary";

const STORAGE_KEY = "lumimt:locale";

interface LanguageValue {
  locale: Locale;
  t: Dictionary;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageValue | null>(null);

/**
 * Language as client state rather than as a route.
 *
 * The Next guide recommends locale sub-paths (/pt, /en) with a proxy,
 * which is the right call when both languages need to be crawled
 * separately. Here the requirement was a button, and the page is a
 * single statically prerendered route — routing would force it dynamic
 * for a value that only ever changes on a click. Portuguese is what the
 * server renders and what a crawler sees; English is a client switch.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "pt" || stored === "en") setLocale(stored);
    } catch {
      // blocked storage: the default simply stands
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = dictionaries[locale].htmlLang;
  }, [locale]);

  const toggle = useCallback(() => {
    setLocale((current) => {
      const next: Locale = current === "pt" ? "en" : "pt";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // not persisting is survivable; switching still works
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ locale, t: dictionaries[locale], toggle }),
    [locale, toggle],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return value;
}
