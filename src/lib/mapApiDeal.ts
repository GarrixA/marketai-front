import type { Deal, DealStatus } from "@/lib/marketplaceTypes";
import type { ApiDeal, ApiDealStatus } from "@/types/deal";

function mapStatus(
  status: ApiDealStatus,
  payment?: ApiDeal["payment"]
): DealStatus {
  switch (status) {
    case "TRANSPORT_REQUESTED":
      return "transport_open";
    case "TRANSPORT_QUOTED":
      return "transport_quoted";
    case "TRANSPORT_ACCEPTED":
      return "transport_accepted";
    case "PACKAGING_REQUESTED":
      return "packaging_requested";
    case "IN_TRANSIT":
      return "in_transit";
    case "DELIVERY_PENDING":
      return "delivery_pending";
    case "DELIVERED":
      return "delivered";
    case "CONFIRMED":
      return "confirmed";
    case "REJECTED":
      return "rejected";
    case "PAID":
      return "paid";
    default:
      return payment?.status === "SUCCESSFUL" ? "paid" : "requested";
  }
}

const PERSISTED_DEAL =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPersistedDeal(id: string) {
  return PERSISTED_DEAL.test(id);
}

/** Map a persisted API deal into the local Deal shape used by Deals UI. */
export function mapApiDealToLocal(deal: ApiDeal): Deal {
  const product = deal.grade
    ? `${deal.productName} · ${deal.grade}`
    : deal.productName;

  return {
    id: deal.id,
    buyerEmail: deal.buyerEmail,
    buyerName: deal.buyerName,
    buyerBusiness: deal.buyerBusiness,
    product,
    quantity: deal.quantity,
    unit: deal.unit.toLowerCase(),
    deliveryLocation: deal.deliveryLocation,
    requiredDate: deal.requiredDate ?? "",
    targetPrice: deal.targetPrice,
    notes: deal.notes ?? "",
    status: mapStatus(deal.status, deal.payment),
    source: "purchase",
    productId: deal.productId,
    supplierEmail: deal.supplierEmail ?? undefined,
    supplierName: deal.supplierName,
    supplierUserId: deal.supplierId,
    confirmedQty: deal.confirmedQty ?? undefined,
    offerPrice: deal.offerPrice ?? undefined,
    paidAmount: deal.payment?.amount,
    paidAt: deal.payment?.paidAt ?? undefined,
    paymentMethod: deal.payment?.method,
    paymentAccount: deal.payment?.account ?? undefined,
    paymentReleaseStatus: deal.payment?.releaseStatus,
    pickupLocation: deal.pickupLocation ?? undefined,
    transportOfferedFee: deal.transportOfferedFee ?? undefined,
    transportFee: deal.transportFee ?? undefined,
    transportOpenedAt: deal.transportRequestedAt ?? undefined,
    logisticsName: deal.logisticsName ?? undefined,
    logisticsEmail: deal.logisticsEmail ?? undefined,
    transportQuotes:
      deal.logisticsEmail && deal.transportQuoteFee != null
        ? [
            {
              logisticsEmail: deal.logisticsEmail,
              logisticsName: deal.logisticsName || "Deliverer",
              fee: deal.transportQuoteFee,
              note: deal.transportQuoteNote ?? "",
              quotedAt: deal.transportQuotedAt ?? deal.updatedAt,
            },
          ]
        : [],
    acceptedQuoteId: [
      "TRANSPORT_ACCEPTED",
      "PACKAGING_REQUESTED",
      "IN_TRANSIT",
      "DELIVERY_PENDING",
      "DELIVERED",
    ].includes(deal.status)
      ? (deal.logisticsEmail ?? undefined)
      : undefined,
    platformFee: deal.platformFee ?? undefined,
    deliveryPayout: deal.deliveryPayout ?? undefined,
    sellerPayout: deal.sellerPayout ?? undefined,
    settledAt: deal.settledAt ?? undefined,
    createdAt: deal.createdAt,
  };
}
