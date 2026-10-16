export type ProductUnit = "TRAY" | "PIECE" | "KG" | "CRATE" | "DOZEN";

/** Units allowed when setting product price. */
export type ProductPriceUnit = Extract<ProductUnit, "TRAY" | "PIECE">;

export type ProductLocation = {
  id: string;
  province: string | null;
  district: string | null;
  sector: string | null;
  cell: string | null;
  village: string | null;
  address: string | null;
  hood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type ProductCategory = {
  id: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
};

export type ProductOwner = {
  id: string;
  name: string;
  role: "supplier" | "aggregator" | null;
};

export type MarketplaceProduct = {
  id: string;
  ownerId: string | null;
  owner?: ProductOwner | null;
  categoryId: string;
  category: { id: string; name: string } | null;
  name: string;
  imageUrl?: string | null;
  description: string | null;
  size: string | null;
  grade: string | null;
  unit: ProductUnit;
  price: number;
  isActive: boolean;
  isAvailable: boolean;
  availableQuantity: number;
  minQuantity: number;
  useMarketplaceLocation: boolean;
  locationId: string | null;
  location: ProductLocation | null;
  createdAt: string;
  updatedAt: string;
};

export type RwandaLocationInput = {
  province: string;
  district: string;
  sector?: string;
  cell?: string;
  village?: string;
  address?: string;
  hood?: string;
  latitude?: number;
  longitude?: number;
};

export type CreateProductRequest = {
  categoryId?: string;
  name?: string;
  description?: string;
  size?: string;
  grade?: string;
  unit: ProductPriceUnit;
  price: number;
  isActive?: boolean;
  isAvailable?: boolean;
  availableQuantity?: number;
  minQuantity?: number;
  useMarketplaceLocation?: boolean;
  location?: RwandaLocationInput;
};

export type UpdateProductRequest = Partial<CreateProductRequest>;
