import type { DashboardRole } from "@/lib/session";
import type { Deal, InventoryItem, SellOffer } from "@/lib/marketplaceTypes";
import { isDealForSupplier } from "@/lib/marketplaceStore";
import type { DashboardSection } from "@/lib/dashboardNav";
import { countNewSellOffers } from "@/lib/sellOffersSeen";

export function getNavBadges({
  role,
  email,
  deals,
  inventory,
  sellOffers = [],
}: {
  role: DashboardRole;
  email: string;
  deals: Deal[];
  inventory: InventoryItem[];
  sellOffers?: SellOffer[];
}): Partial<Record<DashboardSection, number>> {
  const myBuy = deals.filter((d) => d.buyerEmail === email);
  const mySupply = deals.filter((d) => isDealForSupplier(d, email, inventory));
  const openIncoming = mySupply.filter((d) => d.status === "requested").length;
  const readyToPay = myBuy.filter((d) => d.status === "confirmed").length;
  const supplierAction = mySupply.filter(
    (d) => d.status === "transport_quoted"
  ).length;
  const openTransportJobs = deals.filter(
    (d) =>
      (d.status === "transport_open" || d.status === "transport_quoted") &&
      !d.transportQuotes.some((q) => q.logisticsEmail === email)
  ).length;
  const newSellOffers = countNewSellOffers(sellOffers, email);

  const badges: Partial<Record<DashboardSection, number>> = {};

  if (role === "buyer") {
    if (newSellOffers) badges["Sell Offers"] = newSellOffers;
    if (myBuy.filter((d) => d.status === "requested").length) {
      badges["Buy Requests"] = myBuy.filter(
        (d) => d.status === "requested"
      ).length;
    }
    if (readyToPay) badges.Deals = readyToPay;
  }

  if (role === "supplier") {
    if (openIncoming) badges["Buy Requests"] = openIncoming;
    if (supplierAction) badges.Deals = supplierAction;
  }

  if (role === "aggregator") {
    if (newSellOffers) badges["Sell Offers"] = newSellOffers;
    const buyOpen = myBuy.filter((d) => d.status === "requested").length;
    const buyRequests = openIncoming + buyOpen;
    if (buyRequests) badges["Buy Requests"] = buyRequests;
    const dealsAction = readyToPay + supplierAction;
    if (dealsAction) badges.Deals = dealsAction;
  }

  if (role === "logistics" && openTransportJobs) {
    badges.Transport = openTransportJobs;
  }

  if (role === "admin") {
    const allOpen = deals.filter((d) => d.status === "requested").length;
    if (allOpen) badges.Deals = allOpen;
  }

  const total = Object.values(badges).reduce((sum, n) => sum + (n ?? 0), 0);
  if (total > 0) badges.Overview = total;

  return badges;
}
