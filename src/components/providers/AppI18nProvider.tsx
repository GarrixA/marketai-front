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
import AppDirI18nProvider from "next-translate/AppDirI18nProvider";
import type { I18nDictionary, LoaderConfig } from "next-translate";
import {
  DEFAULT_LOCALE,
  I18N_NAMESPACES,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  loadLocaleNamespaces,
  normalizeLocale,
  type AppLocale,
} from "@/lib/i18n";

type LocaleContextValue = {
  lang: AppLocale;
  setLanguage: (lang: AppLocale) => Promise<void>;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue>({
  lang: DEFAULT_LOCALE,
  setLanguage: async () => undefined,
  ready: false,
});

const i18nConfig: LoaderConfig = {
  locales: ["en", "rw"],
  defaultLocale: DEFAULT_LOCALE,
  pages: {
    "*": [...I18N_NAMESPACES],
  },
};

function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const fromStorage = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (fromStorage) return normalizeLocale(fromStorage);

    const settingsRaw = window.localStorage.getItem("soko_workspace_settings");
    if (settingsRaw) {
      const settings = JSON.parse(settingsRaw) as { language?: string };
      if (settings.language) return normalizeLocale(settings.language);
    }

    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${LOCALE_COOKIE}=`))
      ?.split("=")[1];
    if (cookie) return normalizeLocale(cookie);
  } catch {
    // Keep default locale when storage is unavailable.
  }
  return DEFAULT_LOCALE;
}

function persistLocale(lang: AppLocale) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, lang);
  document.cookie = `${LOCALE_COOKIE}=${lang};path=/;max-age=31536000;samesite=lax`;
  document.documentElement.lang = lang;

  try {
    const settingsRaw = window.localStorage.getItem("soko_workspace_settings");
    const settings = settingsRaw
      ? (JSON.parse(settingsRaw) as Record<string, unknown>)
      : {};
    window.localStorage.setItem(
      "soko_workspace_settings",
      JSON.stringify({ ...settings, language: lang })
    );
  } catch {
    // Locale cookie/storage is enough if settings sync fails.
  }
}

export function useAppLocale() {
  return useContext(LocaleContext);
}

export default function AppI18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<AppLocale>(DEFAULT_LOCALE);
  const [namespaces, setNamespaces] = useState<Record<
    string,
    I18nDictionary
  > | null>(null);
  const [ready, setReady] = useState(false);

  const applyLocale = useCallback(async (next: AppLocale) => {
    const loaded = await loadLocaleNamespaces(next);
    setLang(next);
    setNamespaces(loaded);
    persistLocale(next);
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const preferred = readStoredLocale();
    void loadLocaleNamespaces(preferred).then((loaded) => {
      if (cancelled) return;
      setLang(preferred);
      setNamespaces(loaded);
      persistLocale(preferred);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback(
    async (next: AppLocale) => {
      if (next === lang && namespaces) {
        persistLocale(next);
        return;
      }
      await applyLocale(next);
    },
    [applyLocale, lang, namespaces]
  );

  const value = useMemo(
    () => ({ lang, setLanguage, ready }),
    [lang, setLanguage, ready]
  );

  if (!namespaces) {
    return (
      <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
    );
  }

  return (
    <LocaleContext.Provider value={value}>
      <AppDirI18nProvider
        key={lang}
        lang={lang}
        namespaces={namespaces}
        config={i18nConfig}
      >
        {children}
      </AppDirI18nProvider>
    </LocaleContext.Provider>
  );
}
