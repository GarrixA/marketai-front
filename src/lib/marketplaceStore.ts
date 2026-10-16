import type {
  Deal,
  InventoryItem,
  MarketplaceState,
  SellerRole,
  SellOffer,
  TransportQuote,
} from "@/lib/marketplaceTypes";

const STORAGE_KEY = "soko_marketplace_demo_v8";
export const MARKETPLACE_STORAGE_KEY = STORAGE_KEY;

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const seedMarketplace = (): MarketplaceState => ({
  inventory: [],
  deals: [],
  sellOffers: [],
});

type Listener = () => void;

let memoryState: MarketplaceState | null = null;
const listeners = new Set<Listener>();

function readState(): MarketplaceState {
  if (typeof window === "undefined") {
    return seedMarketplace();
  }
  if (memoryState) return memoryState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MarketplaceState;
      memoryState = {
        ...parsed,
        sellOffers: parsed.sellOffers ?? [],
      };
      return memoryState;
    }
  } catch {
    /* fall through */
  }
  memoryState = seedMarketplace();
  return memoryState;
}

function writeState(next: MarketplaceState) {
  memoryState = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

/** Force re-read from localStorage (e.g. after another tab wrote). */
export function reloadMarketplaceFromStorage() {
  if (typeof window === "undefined") return seedMarketplace();
  memoryState = null;
  return readState();
}

export function subscribeMarketplace(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMarketplaceState(): MarketplaceState {
  return readState();
}

export function clearMarketplaceStorage() {
  memoryState = seedMarketplace();
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((l) => l());
}

export function resetMarketplace() {
  clearMarketplaceStorage();
}

export function formatRwf(amount: number) {
  return `RWF ${amount.toLocaleString("en-RW")}`;
}

export function dealStatusLabel(status: Deal["status"]) {
  switch (status) {
    case "requested":
      return "Awaiting supplier";
    case "confirmed":
      return "Quantity confirmed";
    case "rejected":
      return "Rejected";
    case "paid":
      return "Paid";
    case "transport_open":
      return "Transport requested";
    case "transport_quoted":
      return "Price proposed";
    case "transport_accepted":
      return "Delivery booked";
    case "packaging_requested":
      return "Confirm packaging";
    case "in_transit":
      return "In transit";
    case "delivery_pending":
      return "Confirm delivery";
    case "delivered":
      return "Delivered";
    default:
      return status;
  }
}

/** True for RFQs created on the Buy Requests page (not product/listing purchases). */
export function isRfqDeal(deal: Deal) {
  if (deal.source === "rfq") return true;
  if (deal.source === "purchase") return false;
  // Legacy rows: treat listing/product buys as purchases.
  return !deal.listingId && !deal.productId;
}

export function createBuyRequest(input: {
  buyerEmail: string;
  buyerName: string;
  buyerBusiness: string;
  product: string;
  quantity: number;
  unit: string;
  deliveryLocation: string;
  requiredDate: string;
  targetPrice: number;
  notes: string;
  supplierEmail?: string;
  supplierName?: string;
}) {
  const state = readState();
  const deal: Deal = {
    id: uid("deal"),
    ...input,
    source: "rfq",
    status: "requested",
    transportQuotes: [],
    createdAt: new Date().toISOString(),
  };
  writeState({ ...state, deals: [deal, ...state.deals] });
  return deal;
}

export function createBuyFromListing(input: {
  listingId: string;
  quantity: number;
  buyerEmail: string;
  buyerName: string;
  buyerBusiness: string;
  deliveryLocation: string;
}) {
  const state = readState();
  const listing = state.inventory.find((i) => i.id === input.listingId);
  if (!listing) return null;

  const qty = Math.min(
    Math.max(input.quantity, listing.minOrder),
    listing.quantity
  );

  const deal: Deal = {
    id: uid("deal"),
    buyerEmail: input.buyerEmail,
    buyerName: input.buyerName,
    buyerBusiness: input.buyerBusiness,
    product: `${listing.product} · ${listing.grade}`,
    quantity: qty,
    unit: listing.unit,
    deliveryLocation: input.deliveryLocation,
    requiredDate: new Date(Date.now() + 3 * 86400000)
      .toISOString()
      .slice(0, 10),
    targetPrice: listing.pricePerUnit,
    notes: `Buy from listing ${listing.id}`,
    status: "requested",
    source: "purchase",
    listingId: listing.id,
    supplierEmail: listing.ownerEmail,
    supplierName: listing.ownerName,
    pickupLocation: listing.location,
    transportQuotes: [],
    createdAt: new Date().toISOString(),
  };

  writeState({ ...state, deals: [deal, ...state.deals] });
  return deal;
}

/** Create a deal from a live marketplace product (API) so the owner can confirm on Deals. */
export function createBuyFromProduct(input: {
  productId: string;
  productName: string;
  grade?: string | null;
  unit: string;
  quantity: number;
  minQuantity: number;
  availableQuantity: number;
  pricePerUnit: number;
  pickupLocation: string;
  buyerEmail: string;
  buyerName: string;
  buyerBusiness: string;
  deliveryLocation: string;
  supplierUserId: string;
  supplierName: string;
}) {
  const state = readState();
  const qty = Math.min(
    Math.max(input.quantity, Math.max(1, input.minQuantity)),
    Math.max(1, input.availableQuantity)
  );

  const deal: Deal = {
    id: uid("deal"),
    buyerEmail: input.buyerEmail,
    buyerName: input.buyerName,
    buyerBusiness: input.buyerBusiness,
    product: input.grade
      ? `${input.productName} · ${input.grade}`
      : input.productName,
    quantity: qty,
    unit: input.unit.toLowerCase(),
    deliveryLocation: input.deliveryLocation,
    requiredDate: new Date(Date.now() + 3 * 86400000)
      .toISOString()
      .slice(0, 10),
    targetPrice: input.pricePerUnit,
    notes: `Buy from product ${input.productId}`,
    status: "requested",
    source: "purchase",
    productId: input.productId,
    supplierUserId: input.supplierUserId,
    supplierName: input.supplierName,
    pickupLocation: input.pickupLocation,
    transportQuotes: [],
    createdAt: new Date().toISOString(),
  };

  writeState({ ...state, deals: [deal, ...state.deals] });
  return deal;
}

export function confirmDealQuantity(input: {
  dealId: string;
  supplierEmail: string;
  supplierName: string;
  supplierUserId?: string;
  confirmedQty: number;
  offerPrice: number;
  pickupLocation: string;
}) {
  const state = readState();
  writeState({
    ...state,
    deals: state.deals.map((d) =>
      d.id === input.dealId
        ? {
            ...d,
            status: "confirmed",
            supplierEmail: input.supplierEmail,
            supplierName: input.supplierName,
            supplierUserId: input.supplierUserId ?? d.supplierUserId,
            confirmedQty: input.confirmedQty,
            offerPrice: input.offerPrice,
            pickupLocation: input.pickupLocation,
          }
        : d
    ),
  });
}

export function rejectDeal(input: {
  dealId: string;
  supplierEmail: string;
  supplierName: string;
  supplierUserId?: string;
}) {
  const state = readState();
  writeState({
    ...state,
    deals: state.deals.map((d) =>
      d.id === input.dealId && d.status === "requested"
        ? {
            ...d,
            status: "rejected",
            supplierEmail: input.supplierEmail,
            supplierName: input.supplierName,
            supplierUserId: input.supplierUserId ?? d.supplierUserId,
          }
        : d
    ),
  });
}

export function isDealForSupplier(
  deal: Deal,
  supplierEmail: string,
  inventory: InventoryItem[],
  supplierUserId?: string
) {
  if (deal.buyerEmail === supplierEmail) return false;
  if (deal.supplierEmail === supplierEmail) return true;
  if (supplierUserId && deal.supplierUserId === supplierUserId) return true;

  const mine = inventory.filter((i) => i.ownerEmail === supplierEmail);
  if (deal.listingId && mine.some((i) => i.id === deal.listingId)) return true;

  if (
    !deal.supplierEmail &&
    !deal.supplierUserId &&
    deal.status === "requested"
  ) {
    return mine.some((i) => {
      const label = `${i.product} · ${i.grade}`;
      return deal.product === label || deal.product === i.product;
    });
  }

  return false;
}

export function payDeal(dealId: string) {
  const state = readState();
  const deal = state.deals.find((d) => d.id === dealId);
  if (
    !deal ||
    deal.status !== "confirmed" ||
    !deal.offerPrice ||
    !deal.confirmedQty
  ) {
    return;
  }

  const paidAmount = deal.offerPrice * deal.confirmedQty;
  const inventory = state.inventory.map((item) => {
    if (deal.listingId && item.id === deal.listingId) {
      return {
        ...item,
        quantity: Math.max(0, item.quantity - (deal.confirmedQty ?? 0)),
      };
    }
    if (
      !deal.listingId &&
      deal.supplierEmail &&
      item.ownerEmail === deal.supplierEmail &&
      deal.product.toLowerCase().includes(item.grade.toLowerCase())
    ) {
      return {
        ...item,
        quantity: Math.max(0, item.quantity - (deal.confirmedQty ?? 0)),
      };
    }
    return item;
  });

  writeState({
    ...state,
    inventory,
    deals: state.deals.map((d) =>
      d.id === dealId
        ? {
            ...d,
            status: "transport_open",
            paidAmount,
            paidAt: new Date().toISOString(),
            transportOpenedAt: new Date().toISOString(),
          }
        : d
    ),
  });
}

export function requestTransport(dealId: string, fee?: number) {
  const state = readState();
  writeState({
    ...state,
    deals: state.deals.map((d) =>
      d.id === dealId && d.status === "paid"
        ? {
            ...d,
            status: "transport_open",
            transportOpenedAt: new Date().toISOString(),
            transportOfferedFee: fee,
            transportFee: fee,
          }
        : d
    ),
  });
}

export function quoteTransport(input: {
  dealId: string;
  logisticsEmail: string;
  logisticsName: string;
  fee: number;
  note: string;
}) {
  const state = readState();
  const quote: TransportQuote = {
    logisticsEmail: input.logisticsEmail,
    logisticsName: input.logisticsName,
    fee: input.fee,
    note: input.note,
    quotedAt: new Date().toISOString(),
  };
  writeState({
    ...state,
    deals: state.deals.map((d) =>
      d.id === input.dealId
        ? {
            ...d,
            status: "transport_quoted",
            transportQuotes: [
              ...d.transportQuotes.filter(
                (q) => q.logisticsEmail !== input.logisticsEmail
              ),
              quote,
            ],
          }
        : d
    ),
  });
}

export function acceptTransportQuote(dealId: string, logisticsEmail: string) {
  const state = readState();
  writeState({
    ...state,
    deals: state.deals.map((d) => {
      if (d.id !== dealId) return d;
      const quote = d.transportQuotes.find(
        (q) => q.logisticsEmail === logisticsEmail
      );
      if (!quote) return d;
      return {
        ...d,
        status: "transport_accepted",
        transportFee: quote.fee,
        acceptedQuoteId: logisticsEmail,
      };
    }),
  });
}

export function upsertInventory(
  item: Omit<InventoryItem, "id" | "publishedAt"> & {
    id?: string;
    publishedAt?: string;
  }
): string {
  const state = readState();
  const publishedAt = new Date().toISOString();
  if (item.id) {
    writeState({
      ...state,
      inventory: state.inventory.map((row) =>
        row.id === item.id ? { ...row, ...item, id: item.id, publishedAt } : row
      ),
    });
    return item.id;
  }
  const id = uid("inv");
  writeState({
    ...state,
    inventory: [
      {
        ...item,
        id,
        publishedAt,
      },
      ...state.inventory,
    ],
  });
  return id;
}

/** Publish the confirmed Sell order so buyers see it under Sell Offers. */
export function publishSellOffer(input: {
  listingId: string;
  ownerEmail: string;
  ownerName: string;
  ownerRole: SellerRole;
  product: string;
  grade: string;
  quantity: number;
  pricePerUnit: number;
  location: string;
  minOrder: number;
}): SellOffer {
  const state = readState();
  const publishedAt = new Date().toISOString();
  const existing = state.sellOffers.find(
    (o) => o.listingId === input.listingId
  );
  const offer: SellOffer = {
    id: existing?.id ?? uid("offer"),
    listingId: input.listingId,
    ownerEmail: input.ownerEmail,
    ownerName: input.ownerName,
    ownerRole: input.ownerRole,
    product: input.product,
    grade: input.grade,
    quantity: input.quantity,
    unit: "trays",
    pricePerUnit: input.pricePerUnit,
    location: input.location,
    minOrder: input.minOrder,
    publishedAt,
  };

  writeState({
    ...state,
    sellOffers: [
      offer,
      ...state.sellOffers.filter((o) => o.listingId !== input.listingId),
    ],
  });
  return offer;
}

export function removeInventory(id: string) {
  const state = readState();
  writeState({
    ...state,
    inventory: state.inventory.filter((row) => row.id !== id),
    sellOffers: state.sellOffers.filter((o) => o.listingId !== id),
  });
}
