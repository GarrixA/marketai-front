import type { Deal } from "@/lib/marketplaceTypes";
import type { OpenBuyRequest } from "@/types/request";

export function openRequestToDeal(request: OpenBuyRequest): Deal {
  return {
    id: request.id,
    buyerEmail: request.buyerEmail,
    buyerName: request.buyerName,
    buyerBusiness: request.buyerBusiness,
    product: request.product,
    quantity: request.quantity,
    unit: request.unit,
    deliveryLocation: request.deliveryLocation,
    requiredDate: request.requiredDate,
    targetPrice: request.targetPrice,
    notes: request.notes,
    status: "requested",
    source: "rfq",
    transportQuotes: [],
    createdAt: request.createdAt,
  };
}
