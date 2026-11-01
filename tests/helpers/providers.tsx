import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import AppDirI18nProvider from "next-translate/AppDirI18nProvider";
import type { LoaderConfig } from "next-translate";
import StoreProvider from "@/components/providers/StoreProvider";
import { I18N_NAMESPACES } from "@/lib/i18n";
import accountMenu from "../../locales/en/accountMenu.json";
import common from "../../locales/en/common.json";
import brand from "../../locales/en/brand.json";
import buyRequests from "../../locales/en/buyRequests.json";
import dashboard from "../../locales/en/dashboard.json";
import dates from "../../locales/en/dates.json";
import deals from "../../locales/en/deals.json";
import hero from "../../locales/en/hero.json";
import listProductForSale from "../../locales/en/listProductForSale.json";
import logisticsDashboard from "../../locales/en/logisticsDashboard.json";
import auth from "../../locales/en/auth.json";
import market from "../../locales/en/market.json";
import marketPulse from "../../locales/en/marketPulse.json";
import myAccount from "../../locales/en/myAccount.json";
import navigation from "../../locales/en/navigation.json";
import orders from "../../locales/en/orders.json";
import products from "../../locales/en/products.json";
import sales from "../../locales/en/sales.json";
import search from "../../locales/en/search.json";
import sellOffers from "../../locales/en/sellOffers.json";
import settings from "../../locales/en/settings.json";
import suppliers from "../../locales/en/suppliers.json";
import support from "../../locales/en/support.json";
import users from "../../locales/en/users.json";
import workspace from "../../locales/en/workspace.json";

export const enNamespaces = {
  brand,
  navigation,
  hero,
  marketPulse,
  search,
  suppliers,
  workspace,
  dashboard,
  dates,
  users,
  support,
  products,
  deals,
  listProductForSale,
  sellOffers,
  buyRequests,
  orders,
  sales,
  accountMenu,
  myAccount,
  settings,
  market,
  logisticsDashboard,
  auth,
  common,
};

const i18nConfig: LoaderConfig = {
  locales: ["en", "rw"],
  defaultLocale: "en",
  pages: {
    "*": [...I18N_NAMESPACES],
  },
};

export function TestI18nProvider({ children }: { children: ReactNode }) {
  return (
    <AppDirI18nProvider lang="en" namespaces={enNamespaces} config={i18nConfig}>
      {children}
    </AppDirI18nProvider>
  );
}

export function renderWithProviders(ui: ReactElement) {
  return render(
    <TestI18nProvider>
      <StoreProvider>{ui}</StoreProvider>
    </TestI18nProvider>
  );
}
