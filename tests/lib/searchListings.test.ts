import { describe, expect, it } from "vitest";
import type { ProductListing } from "@/lib/listings";
import { searchListings } from "@/lib/searchListings";

const sample: ProductListing[] = [
  {
    name: "Fresh eggs · Large",
    supplier: "Musanze Growers Co-op",
    location: "Gasabo, Kigali",
    price: "4,000",
    priceValue: 4000,
    priceUnit: "tray",
    qtyValue: 320,
    qty: "320 trays",
    minValue: 20,
    min: "20 trays",
    rating: "4.8",
    category: "Eggs",
  },
  {
    name: "Fresh eggs · Medium",
    supplier: "Northern Egg Hub",
    location: "Musanze",
    price: "3,750",
    priceValue: 3750,
    priceUnit: "tray",
    qtyValue: 180,
    qty: "180 trays",
    minValue: 15,
    min: "15 trays",
    rating: "4.9",
    category: "Eggs",
  },
  {
    name: "Fresh eggs · Free-range",
    supplier: "Ruhango Layers",
    location: "Ruhango",
    price: "4,800",
    priceValue: 4800,
    priceUnit: "tray",
    qtyValue: 90,
    qty: "90 trays",
    minValue: 10,
    min: "10 trays",
    rating: "4.9",
    category: "Eggs",
  },
];

describe("searchListings", () => {
  it("matches synonyms like tray -> eggs", () => {
    const results = searchListings(sample, {
      query: "tray",
      location: "",
      quantity: "",
      category: "",
    });

    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((item) => item.name.toLowerCase().includes("egg"))
    ).toBe(true);
  });

  it("filters by location districts under Kigali", () => {
    const results = searchListings(sample, {
      query: "",
      location: "Kigali",
      quantity: "",
      category: "",
    });

    expect(results).toHaveLength(1);
    expect(results[0].location).toContain("Kigali");
  });

  it("matches free-range egg listings", () => {
    const results = searchListings(sample, {
      query: "Ruhango",
      location: "",
      quantity: "",
      category: "Eggs",
    });

    expect(results.some((item) => item.name.includes("Free-range"))).toBe(true);
  });

  it("applies category and quantity together", () => {
    const results = searchListings(sample, {
      query: "",
      location: "",
      quantity: "200+",
      category: "Eggs",
    });

    expect(results.map((item) => item.name)).toEqual(["Fresh eggs · Large"]);
  });
});
