export type ApiDealStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "REJECTED"
  | "PAID"
  | "TRANSPORT_REQUESTED"
  | "TRANSPORT_QUOTED"
  | "TRANSPORT_ACCEPTED"
  | "PACKAGING_REQUESTED"
  | "IN_TRANSIT"
  | "DELIVERY_PENDING"
  | "DELIVERED";

export type ApiDealPayment = {
  id: string;
  amount: number;
  currency: string;
  method: "MOBILE_MONEY" | "CARD" | string;
  account: string | null;
  status: string;
  releaseStatus: "HELD" | "RELEASED" | string;
  paidAt: string | null;
};

export type ApiDeal = {
  id: string;
  buyerId: string;
  supplierId: string;
  productId: string;
  productName: string;
  grade: string | null;
  unit: string;
  quantity: number;
  targetPrice: number;
  deliveryLocation: string;
  pickupLocation: string | null;
  requiredDate: string | null;
  notes: string | null;
  status: ApiDealStatus;
  confirmedQty: number | null;
  offerPrice: number | null;
  buyerName: string;
  buyerEmail: string;
  buyerBusiness: string;
  supplierName: string;
  supplierEmail: string | null;
  transportOfferedFee: number | null;
  transportQuoteFee: number | null;
  transportFee: number | null;
  transportQuoteNote: string | null;
  logisticsUserId: string | null;
  logisticsName: string | null;
  logisticsEmail: string | null;
  transportRequestedAt: string | null;
  transportQuotedAt: string | null;
  transportAcceptedAt: string | null;
  packagingRequestedAt: string | null;
  packagingConfirmedAt: string | null;
  inTransitAt: string | null;
  deliveryRequestedAt: string | null;
  deliveredAt: string | null;
  platformFee: number | null;
  deliveryPayout: number | null;
  sellerPayout: number | null;
  settledAt: string | null;
  createdAt: string;
  updatedAt: string;
  payment?: ApiDealPayment | null;
};

export type AdminDeal = ApiDeal & {
  buyerRoles: string[];
  supplierRoles: string[];
  buyerAvatarUrl: string | null;
  supplierAvatarUrl: string | null;
};

export type CreateDealRequest = {
  productId: string;
  quantity: number;
  deliveryLocation: string;
  requiredDate?: string;
  notes?: string;
};

export type ConfirmDealRequest = {
  confirmedQty: number;
  offerPrice: number;
  pickupLocation: string;
};

export type PayDealRequest = {
  method: "MOBILE_MONEY" | "CARD";
  account: string;
  deliveryLocation?: string;
};

export type RequestTransportRequest = {
  fee?: number;
};

export type QuoteTransportRequest = {
  fee: number;
  note?: string;
};

export type LogisticsIncomeEntry = {
  dealId: string;
  productName: string;
  buyerName: string;
  pickupLocation: string | null;
  deliveryLocation: string;
  amount: number;
  paidAt: string;
};

export type LogisticsIncome = {
  currency: string;
  count: number;
  total: number;
  entries: LogisticsIncomeEntry[];
};
