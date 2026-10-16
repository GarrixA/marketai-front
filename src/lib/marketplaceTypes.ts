export type DealStatus =
  | "requested"
  | "confirmed"
  | "rejected"
  | "paid"
  | "transport_open"
  | "transport_quoted"
  | "transport_accepted"
  | "packaging_requested"
  | "in_transit"
  | "delivery_pending"
  | "delivered";

/** rfq = created on Buy Requests page; purchase = buy from a product/listing → Deals. */
export type DealSource = "rfq" | "purchase";

export type SellerRole = "supplier" | "aggregator";

export type InventoryItem = {
  id: string;
  ownerEmail: string;
  ownerName: string;
  ownerRole: SellerRole;
  product: string;
  grade: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  location: string;
  paymentMethod: string;
  minOrder: number;
  trades: number;
  completionRate: number;
  rating: number;
  responseMins: number;
  publishedAt: string;
};

export type TransportQuote = {
  logisticsEmail: string;
  logisticsName: string;
  fee: number;
  note: string;
  quotedAt: string;
};

export type Deal = {
  id: string;
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
  status: DealStatus;
  source?: DealSource;
  listingId?: string;
  productId?: string;
  supplierEmail?: string;
  supplierName?: string;
  /** Product owner user id — used when email is not available from the API. */
  supplierUserId?: string;
  confirmedQty?: number;
  offerPrice?: number;
  paidAmount?: number;
  paidAt?: string;
  paymentMethod?: string;
  paymentAccount?: string;
  paymentReleaseStatus?: string;
  pickupLocation?: string;
  transportOfferedFee?: number;
  transportFee?: number;
  transportOpenedAt?: string;
  logisticsName?: string;
  logisticsEmail?: string;
  transportQuotes: TransportQuote[];
  acceptedQuoteId?: string;
  platformFee?: number;
  deliveryPayout?: number;
  sellerPayout?: number;
  settledAt?: string;
  createdAt: string;
};

export type SellOffer = {
  id: string;
  listingId: string;
  ownerEmail: string;
  ownerName: string;
  ownerRole: SellerRole;
  product: string;
  grade: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  location: string;
  minOrder: number;
  publishedAt: string;
};

export type MarketplaceState = {
  inventory: InventoryItem[];
  deals: Deal[];
  sellOffers: SellOffer[];
};
