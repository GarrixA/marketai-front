const namespaces = [
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
];

module.exports = {
  locales: ["en", "rw"],
  defaultLocale: "en",
  // App Router: load namespaces through AppI18nProvider instead of the page loader.
  loader: false,
  pages: {
    "*": namespaces,
  },
  loadLocaleFrom: (lang, ns) =>
    import(`./locales/${lang}/${ns}.json`).then((m) => m.default),
};
