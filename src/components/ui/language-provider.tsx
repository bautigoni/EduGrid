"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { dictionary, type Locale, type TranslationKey } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  mounted: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("horaria_locale");
    if (stored === "en" || stored === "es") {
      setLocaleState(stored);
      document.documentElement.lang = stored;
    } else {
      document.documentElement.lang = "es";
    }
    setMounted(true);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    function setLocale(nextLocale: Locale) {
      setLocaleState(nextLocale);
      window.localStorage.setItem("horaria_locale", nextLocale);
      document.cookie = `horaria_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = nextLocale;
    }
    return {
      locale,
      mounted,
      setLocale,
      t: (key) => dictionary[locale][key]
    };
  }, [locale, mounted]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within LanguageProvider");
  }
  return context;
}
