import type { I18nDictionary } from "next-translate";

export const LOCALES = ["en", "rw"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const I18N_NAMESPACES = [
  "brand",
  "navigation",
  "hero",
  "marketPulse",
  "search",
  "suppliers",
  "workspace",
  "dashboard",
  "dates",
  "users",
  "support",
  "products",
  "deals",
  "listProductForSale",
  "sellOffers",
  "buyRequests",
  "orders",
  "sales",
  "accountMenu",
  "myAccount",
  "settings",
  "market",
  "logisticsDashboard",
  "auth",
  "common",
] as const;

export type I18nNamespace = (typeof I18N_NAMESPACES)[number];

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_STORAGE_KEY = "soko_locale";

export function isAppLocale(value: unknown): value is AppLocale {
  return value === "en" || value === "rw";
}

export function normalizeLocale(value: unknown): AppLocale {
  if (value === "rw") return "rw";
  return "en";
}

export async function loadLocaleNamespaces(
  lang: AppLocale
): Promise<Record<string, I18nDictionary>> {
  const entries = await Promise.all(
    I18N_NAMESPACES.map(async (ns) => {
      const mod = await import(`../../locales/${lang}/${ns}.json`);
      return [ns, mod.default as I18nDictionary] as const;
    })
  );
  return Object.fromEntries(entries);
}
