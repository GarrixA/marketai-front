import type { DashboardRole } from "@/lib/session";
import type { Deal, InventoryItem, SellOffer } from "@/lib/marketplaceTypes";
import { isPersistedDeal } from "@/lib/mapApiDeal";
import { isDealForSupplier, isRfqDeal } from "@/lib/marketplaceStore";
import type { DashboardSection } from "@/lib/dashboardNav";
import { countNewSellOffers } from "@/lib/sellOffersSeen";

export function getNavBadges({
  role,
  email,
  userId,
  deals,
  inventory,
  sellOffers = [],
  apiDeals = [],
}: {
  role: DashboardRole;
  email: string;
  userId?: string;
  deals: Deal[];
  inventory: InventoryItem[];
  sellOffers?: SellOffer[];
  /** Persisted product-purchase deals from the API (buyer + seller views). */
  apiDeals?: Deal[];
}): Partial<Record<DashboardSection, number>> {
  const byId = new Map<string, Deal>();
  for (const deal of deals) byId.set(deal.id, deal);
  for (const deal of apiDeals) byId.set(deal.id, deal);
  // Product purchases and transport come from the API. Buy requests are still
  // stored in the browser, so those local RFQs stay countable.
  const allDeals = Array.from(byId.values()).filter(
    (deal) => isPersistedDeal(deal.id) || isRfqDeal(deal)
  );

  const myBuy = allDeals.filter((d) => d.buyerEmail === email);
  const myRfq = myBuy.filter(isRfqDeal);
  const myPurchases = myBuy.filter((d) => !isRfqDeal(d));
  const mySupply = allDeals.filter((d) =>
    isDealForSupplier(d, email, inventory, userId)
  );
  const supplyPurchases = mySupply.filter((d) => !isRfqDeal(d));
  const supplyRfqs = mySupply.filter(isRfqDeal);
  const openPurchaseIncoming = supplyPurchases.filter(
    (d) => d.status === "requested"
  ).length;
  const openRfqIncoming = supplyRfqs.filter(
    (d) => d.status === "requested"
  ).length;
  const readyToPay = myBuy.filter((d) => d.status === "confirmed").length;
  const awaitingSeller = myPurchases.filter(
    (d) => d.status === "requested"
  ).length;
  const supplierAction = supplyPurchases.filter(
    (d) => d.status === "transport_quoted" || d.status === "packaging_requested"
  ).length;
  const openTransportJobs = allDeals.filter(
    (d) =>
      isPersistedDeal(d.id) &&
      (d.status === "transport_open" || d.status === "transport_quoted") &&
      !d.transportQuotes.some((q) => q.logisticsEmail === email)
  ).length;
  const newSellOffers = countNewSellOffers(sellOffers, email);

  const badges: Partial<Record<DashboardSection, number>> = {};

  if (role === "buyer") {
    const rfqOpen = myRfq.filter((d) => d.status === "requested").length;
    if (rfqOpen) badges["Buy Requests"] = rfqOpen;
    const dealsAction = awaitingSeller + readyToPay;
    if (dealsAction) badges.Deals = dealsAction;
    const tracking = myPurchases.filter((deal) =>
      [
        "paid",
        "transport_open",
        "transport_quoted",
        "transport_accepted",
        "packaging_requested",
        "in_transit",
        "delivery_pending",
      ].includes(deal.status)
    ).length;
    if (tracking) badges.Orders = tracking;
  }

  if (role === "supplier") {
    if (openRfqIncoming) badges["Buy Requests"] = openRfqIncoming;
    const dealsAction = openPurchaseIncoming + supplierAction;
    if (dealsAction) badges.Deals = dealsAction;
    const tracking = supplyPurchases.filter((deal) =>
      [
        "paid",
        "transport_open",
        "transport_quoted",
        "transport_accepted",
        "packaging_requested",
        "in_transit",
        "delivery_pending",
      ].includes(deal.status)
    ).length;
    if (tracking) badges.Sales = tracking;
  }

  if (role === "aggregator") {
    if (newSellOffers) badges["Sell Offers"] = newSellOffers;
    const rfqOpen =
      myRfq.filter((d) => d.status === "requested").length + openRfqIncoming;
    if (rfqOpen) badges["Buy Requests"] = rfqOpen;
    const dealsAction =
      openPurchaseIncoming + awaitingSeller + readyToPay + supplierAction;
    if (dealsAction) badges.Deals = dealsAction;
    const active = [
      "paid",
      "transport_open",
      "transport_quoted",
      "transport_accepted",
      "packaging_requested",
      "in_transit",
      "delivery_pending",
    ];
    const buyerTracking = myPurchases.filter((deal) =>
      active.includes(deal.status)
    ).length;
    const sellerTracking = supplyPurchases.filter((deal) =>
      active.includes(deal.status)
    ).length;
    if (buyerTracking) badges.Orders = buyerTracking;
    if (sellerTracking) badges.Sales = sellerTracking;
  }

  if (role === "logistics") {
    const mine = allDeals.filter(
      (deal) =>
        deal.logisticsEmail === email &&
        (deal.status === "transport_accepted" || deal.status === "in_transit")
    ).length;
    const attention = openTransportJobs + mine;
    if (attention) badges.Transport = attention;
  }

  if (role === "admin") {
    const allOpen = allDeals.filter(
      (deal) => isPersistedDeal(deal.id) && deal.status === "requested"
    ).length;
    if (allOpen) badges.Deals = allOpen;
  }

  return badges;
}
