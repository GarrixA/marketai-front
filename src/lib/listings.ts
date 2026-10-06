import type { InventoryItem } from "@/lib/marketplaceTypes";
import { seedMarketplace } from "@/lib/marketplaceStore";

export type ProductListing = {
  id?: string;
  name: string;
  supplier: string;
  location: string;
  price: string;
  qty: string;
  min: string;
  rating: string;
  category?: string;
};

function starRating(percent: number): string {
  const stars = Math.min(5, Math.max(3.5, percent / 20));
  return stars.toFixed(1);
}

export function inventoryToProductListing(item: InventoryItem): ProductListing {
  return {
    id: item.id,
    name: `${item.product} · ${item.grade}`,
    supplier: item.ownerName,
    location: item.location,
    price: item.pricePerUnit.toLocaleString("en-RW"),
    qty: `${item.quantity.toLocaleString("en-RW")} ${item.unit}`,
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

/** Default public catalog from shared seed (supplier + aggregator owned). */
export function getSeedPublicListings(): ProductListing[] {
  return inventoryToProductListings(seedMarketplace().inventory);
}
