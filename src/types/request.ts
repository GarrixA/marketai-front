export type OpenBuyRequest = {
  id: string;
  product: string;
  quantity: number;
  unit: string;
  deliveryLocation: string;
  requiredDate: string;
  targetPrice: number;
  notes: string;
  buyerName: string;
  buyerEmail: string;
  buyerBusiness: string;
  status: string;
  hasMyOffer: boolean;
  createdAt: string;
};

export type CreateOpenBuyRequestBody = {
  product: string;
  quantity: number;
  unit: string;
  deliveryLocation: string;
  requiredDate: string;
  targetPrice: number;
  notes?: string;
};

export type CreateOfferBody = {
  quantity: number;
  unitPrice: number;
  pickupLocation?: string;
};
