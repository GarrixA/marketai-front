import type { DashboardRole } from "@/lib/session";

export type DashboardSection =
  | "Overview"
  | "Market"
  | "Products"
  | "Sell Offers"
  | "Buy Requests"
  | "Deals"
  | "Orders"
  | "Sales"
  | "Transport"
  | "Income"
  | "Users"
  | "Support";

export const SECTION_PATH: Record<DashboardSection, string> = {
  Overview: "/dashboard",
  Market: "/dashboard/market",
  Products: "/dashboard/products",
  "Sell Offers": "/dashboard/sell-offers",
  "Buy Requests": "/dashboard/buy-requests",
  Deals: "/dashboard/deals",
  Orders: "/dashboard/orders",
  Sales: "/dashboard/sales",
  Transport: "/dashboard/transport",
  Income: "/dashboard/income",
  Users: "/dashboard/users",
  Support: "/dashboard/support",
};

export const SECTION_ICON: Record<DashboardSection, string> = {
  Overview: "grid",
  Market: "cart",
  Products: "box",
  "Sell Offers": "star",
  "Buy Requests": "search",
  Deals: "card",
  Orders: "box",
  Sales: "truck",
  Transport: "truck",
  Income: "card",
  Users: "users",
  Support: "card",
};

export const navByRole: Record<DashboardRole, DashboardSection[]> = {
  buyer: ["Overview", "Market", "Products", "Buy Requests", "Deals", "Orders"],
  supplier: [
    "Overview",
    "Market",
    "Products",
    "Buy Requests",
    "Deals",
    "Sales",
  ],
  aggregator: [
    "Overview",
    "Market",
    "Products",
    "Sell Offers",
    "Buy Requests",
    "Deals",
    "Orders",
    "Sales",
  ],
  logistics: ["Overview", "Transport", "Income"],
  admin: ["Overview", "Users", "Support", "Products", "Deals"],
};

export type UtilityPage = "account" | "settings";

export function utilityPageFromPath(pathname: string): UtilityPage | null {
  if (pathname.startsWith("/dashboard/account")) return "account";
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  return null;
}

export function sectionFromPath(pathname: string): DashboardSection {
  if (utilityPageFromPath(pathname)) return "Overview";
  if (pathname.startsWith("/dashboard/market")) return "Market";
  if (pathname.startsWith("/dashboard/products")) return "Products";
  if (pathname.startsWith("/dashboard/sell-offers")) return "Sell Offers";
  if (pathname.startsWith("/dashboard/buy-requests")) return "Buy Requests";
  if (pathname.startsWith("/dashboard/deals")) return "Deals";
  if (pathname.startsWith("/dashboard/orders")) return "Orders";
  if (pathname.startsWith("/dashboard/sales")) return "Sales";
  if (pathname.startsWith("/dashboard/transport")) return "Transport";
  if (pathname.startsWith("/dashboard/income")) return "Income";
  if (pathname.startsWith("/dashboard/users")) return "Users";
  if (pathname.startsWith("/dashboard/support")) return "Support";
  return "Overview";
}

export function roleCanAccess(
  role: DashboardRole,
  section: DashboardSection
): boolean {
  return navByRole[role].includes(section);
}

export function pathForSection(section: string): string {
  return SECTION_PATH[section as DashboardSection] ?? SECTION_PATH.Overview;
}
