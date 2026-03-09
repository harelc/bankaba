'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, he, type Locale, type Translations } from '@/lib/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
  dir: 'rtl' | 'ltr';
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'he',
  setLocale: () => {},
  t: he,
  dir: 'rtl',
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('he');

  useEffect(() => {
    const stored = localStorage.getItem('bankaba-locale') as Locale | null;
    if (stored && (stored === 'he' || stored === 'en')) {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'he' ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('bankaba-locale', newLocale);
  }, []);

  const t = translations[locale];
  const dir = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
