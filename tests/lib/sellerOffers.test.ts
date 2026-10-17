import { describe, expect, it } from "vitest";
import { groupProductsBySeller } from "@/lib/sellerOffers";
import type { MarketplaceProduct } from "@/types/product";

function product(
  overrides: Partial<MarketplaceProduct> &
    Pick<MarketplaceProduct, "id" | "ownerId">
): MarketplaceProduct {
  return {
    categoryId: "eggs",
    category: { id: "eggs", name: "Eggs" },
    name: "Fresh eggs",
    description: null,
    size: null,
    grade: "Large",
    unit: "TRAY",
    price: 4000,
    isActive: true,
    isAvailable: true,
    availableQuantity: 10,
    minQuantity: 1,
    useMarketplaceLocation: true,
    locationId: null,
    location: {
      id: "loc",
      province: "Kigali",
      district: "Gasabo",
      sector: null,
      cell: null,
      village: null,
      address: null,
    },
    owner: {
      id: overrides.ownerId ?? "seller",
      name: "Farm",
      role: "supplier",
    },
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  };
}

describe("groupProductsBySeller", () => {
  it("sums trays and eggs and averages tray price by quantity", () => {
    const sellers = groupProductsBySeller([
      product({
        id: "a",
        ownerId: "sup-1",
        availableQuantity: 100,
        price: 4000,
        unit: "TRAY",
        owner: { id: "sup-1", name: "Hill Farm", role: "supplier" },
      }),
      product({
        id: "b",
        ownerId: "sup-1",
        availableQuantity: 50,
        price: 5000,
        unit: "TRAY",
        name: "Medium trays",
      }),
      product({
        id: "c",
        ownerId: "sup-1",
        availableQuantity: 30,
        price: 80,
        unit: "PIECE",
        name: "Loose eggs",
      }),
      product({
        id: "d",
        ownerId: "agg-1",
        availableQuantity: 20,
        price: 4200,
        unit: "TRAY",
        owner: { id: "agg-1", name: "City Hub", role: "aggregator" },
      }),
      product({
        id: "e",
        ownerId: "sup-1",
        availableQuantity: 0,
        isAvailable: false,
      }),
    ]);

    expect(sellers.map((seller) => seller.name)).toEqual([
      "Hill Farm",
      "City Hub",
    ]);
    const farm = sellers[0];
    expect(farm.trayQuantity).toBe(150);
    expect(farm.eggQuantity).toBe(30);
    expect(farm.averageTrayPrice).toBe(
      Math.round((4000 * 100 + 5000 * 50) / 150)
    );
    expect(farm.listingCount).toBe(3);
    expect(sellers[1].role).toBe("aggregator");
  });
});
