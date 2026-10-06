import { describe, expect, it } from "vitest";
import type { ProductListing } from "@/lib/listings";
import { searchListings } from "@/lib/searchListings";

const sample: ProductListing[] = [
  {
    name: "Grade 1 Dry Maize",
    supplier: "Kigali Grain Collective",
    location: "Gasabo, Kigali",
    price: "8,900",
    qty: "420 bags",
    min: "10 bags",
    rating: "4.8",
    category: "Grains",
  },
  {
    name: "Fresh Mixed Vegetables",
    supplier: "Musanze Growers Co-op",
    location: "Musanze",
    price: "9,800",
    qty: "640 crates",
    min: "20 crates",
    rating: "4.9",
    category: "Produce",
  },
  {
    name: "Hass Avocados",
    supplier: "Ruhango Orchard Network",
    location: "Ruhango",
    price: "14,800",
    qty: "220 crates",
    min: "10 crates",
    rating: "4.9",
    category: "Fruit",
  },
];

describe("searchListings", () => {
  it("matches synonyms like corn -> maize", () => {
    const results = searchListings(sample, {
      query: "corn",
      location: "",
      quantity: "",
      category: "",
    });

    expect(results.map((item) => item.name)).toEqual(["Grade 1 Dry Maize"]);
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

  it("ranks exact product names above weaker matches", () => {
    const results = searchListings(sample, {
      query: "avocado",
      location: "",
      quantity: "",
      category: "",
    });

    expect(results[0].name).toBe("Hass Avocados");
  });

  it("applies category and quantity together", () => {
    const results = searchListings(sample, {
      query: "",
      location: "",
      quantity: "200+",
      category: "Produce",
    });

    expect(results.map((item) => item.name)).toEqual([
      "Fresh Mixed Vegetables",
    ]);
  });
});
