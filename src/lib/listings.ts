import { formatRwandaLocation } from "@/components/forms/RwandaLocationFields";
import type { InventoryItem } from "@/lib/marketplaceTypes";
import { productImageSrc } from "@/lib/productImage";
import type { MarketplaceProduct } from "@/types/product";

export type ProductListing = {
  id?: string;
  name: string;
  /** Product photo. Falls back to the default eggs image when omitted. */
  image?: string;
  supplier: string;
  location: string;
  /** Formatted display price, or "—" when unset */
  price: string;
  /** Numeric unit price in RWF for totals and comparisons */
  priceValue: number;
  /** e.g. "tray" or "piece" for "RWF 500 / tray" */
  priceUnit?: string;
  /** Available quantity as a number */
  qtyValue: number;
  qty: string;
  /** Minimum order quantity as a number */
  minValue: number;
  min: string;
  rating: string;
  category?: string;
};

function starRating(percent: number): string {
  const stars = Math.min(5, Math.max(3.5, percent / 20));
  return stars.toFixed(1);
}

export function inventoryToProductListing(item: InventoryItem): ProductListing {
  const priceValue = Number(item.pricePerUnit) || 0;
  return {
    id: item.id,
    name: `${item.product} · ${item.grade}`,
    image: productImageSrc(),
    supplier: item.ownerName,
    location: item.location,
    price: priceValue > 0 ? priceValue.toLocaleString("en-RW") : "—",
    priceValue,
    priceUnit: item.unit,
    qtyValue: item.quantity,
    qty: `${item.quantity.toLocaleString("en-RW")} ${item.unit}`,
    minValue: item.minOrder,
    min: `${item.minOrder} ${item.unit}`,
    rating: starRating(item.rating),
    category: "Eggs",
  };
}

export function inventoryToProductListings(
  items: InventoryItem[]
): ProductListing[] {
  return items
    .filter((item) => item.quantity > 0)
    .map(inventoryToProductListing);
}

export function marketplaceProductToListing(
  product: MarketplaceProduct
): ProductListing {
  const location = formatRwandaLocation(product.location);
  const unit = product.unit.toLowerCase();
  const priceValue = Number(product.price ?? 0);
  const qtyValue = Number(product.availableQuantity ?? 0);
  const minValue = Math.max(1, Number(product.minQuantity ?? 1));
  const title =
    product.description?.trim() ||
    (product.grade ? `${product.name} · ${product.grade}` : product.name);
  return {
    id: product.id,
    name: title,
    image: productImageSrc(product.imageUrl),
    supplier: product.owner?.name ?? "Seller",
    location: location === "—" ? "Location TBD" : location,
    price: priceValue > 0 ? priceValue.toLocaleString("en-RW") : "—",
    priceValue,
    priceUnit: unit,
    qtyValue,
    qty: `${qtyValue.toLocaleString("en-RW")} ${unit}`,
    minValue,
    min: `${minValue} ${unit}`,
    rating: "—",
    category: product.category?.name ?? "Fresh supply",
  };
}

export function marketplaceProductsToListings(
  products: MarketplaceProduct[]
): ProductListing[] {
  return products
    .filter((product) => product.isAvailable && product.availableQuantity > 0)
    .map(marketplaceProductToListing);
}
