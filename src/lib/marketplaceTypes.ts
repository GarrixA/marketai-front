export type DealStatus =
  | "requested"
  | "confirmed"
  | "paid"
  | "transport_open"
  | "transport_quoted"
  | "transport_accepted";

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
  listingId?: string;
  supplierEmail?: string;
  supplierName?: string;
  confirmedQty?: number;
  offerPrice?: number;
  paidAmount?: number;
  paidAt?: string;
  pickupLocation?: string;
  transportFee?: number;
  transportQuotes: TransportQuote[];
  acceptedQuoteId?: string;
  createdAt: string;
};

export type MarketplaceState = {
  inventory: InventoryItem[];
  deals: Deal[];
};
