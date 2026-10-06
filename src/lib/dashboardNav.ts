import type { DashboardRole } from "@/lib/session";

export type DashboardSection =
  | "Overview"
  | "Products"
  | "Sell Offers"
  | "Buy Requests"
  | "Deals"
  | "Transport";

export const SECTION_PATH: Record<DashboardSection, string> = {
  Overview: "/dashboard",
  Products: "/dashboard/products",
  "Sell Offers": "/dashboard/sell-offers",
  "Buy Requests": "/dashboard/buy-requests",
  Deals: "/dashboard/deals",
  Transport: "/dashboard/transport",
};

export const SECTION_ICON: Record<DashboardSection, string> = {
  Overview: "grid",
  Products: "box",
  "Sell Offers": "star",
  "Buy Requests": "search",
  Deals: "card",
  Transport: "truck",
};

export const navByRole: Record<DashboardRole, DashboardSection[]> = {
  buyer: ["Overview", "Products", "Sell Offers", "Buy Requests", "Deals"],
  supplier: ["Overview", "Products", "Buy Requests", "Deals"],
  aggregator: [
    "Overview",
    "Products",
    "Sell Offers",
    "Buy Requests",
    "Deals",
  ],
  logistics: ["Overview", "Transport"],
  admin: ["Overview", "Products", "Deals"],
};

export function sectionFromPath(pathname: string): DashboardSection {
  if (pathname.startsWith("/dashboard/products")) return "Products";
  if (pathname.startsWith("/dashboard/sell-offers")) return "Sell Offers";
  if (pathname.startsWith("/dashboard/buy-requests")) return "Buy Requests";
  if (pathname.startsWith("/dashboard/deals")) return "Deals";
  if (pathname.startsWith("/dashboard/transport")) return "Transport";
  return "Overview";
}

export function roleCanAccess(
  role: DashboardRole,
  section: DashboardSection
): boolean {
  return navByRole[role].includes(section);
}

export function pathForSection(section: string): string {
  return (
    SECTION_PATH[section as DashboardSection] ?? SECTION_PATH.Overview
  );
}
