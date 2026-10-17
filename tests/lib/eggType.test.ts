import { describe, expect, it } from "vitest";
import {
  availableStock,
  eggTypeLabel,
  groupByEggType,
  productMatchesRequest,
  stockShortfallMessage,
} from "@/lib/eggType";

describe("egg types", () => {
  it("labels grade and size as A · Large", () => {
    expect(
      eggTypeLabel({ name: "Double-yolk eggs", grade: "A", size: "Large" })
    ).toBe("A · Large");
  });

  it("matches a request to that grade and size", () => {
    const product = { name: "Double-yolk eggs", grade: "A", size: "Large" };
    expect(productMatchesRequest("A · Large", product)).toBe(true);
    expect(productMatchesRequest("Fresh eggs · Large", product)).toBe(false);
    expect(
      productMatchesRequest("Fresh eggs · Large", {
        name: "Fresh eggs · Large",
        grade: "Large",
        size: null,
      })
    ).toBe(true);
  });

  it("sums only the matching type and unit", () => {
    const stock = availableStock(
      [
        {
          name: "Double-yolk eggs",
          grade: "A",
          size: "Large",
          unit: "TRAY",
          availableQuantity: 80,
        },
        {
          name: "More large",
          grade: "A",
          size: "Large",
          unit: "TRAY",
          availableQuantity: 40,
        },
        {
          name: "Pieces",
          grade: "A",
          size: "Large",
          unit: "PIECE",
          availableQuantity: 500,
        },
        {
          name: "Medium",
          grade: "B",
          size: "Medium",
          unit: "TRAY",
          availableQuantity: 200,
        },
      ],
      "A · Large",
      "trays"
    );
    expect(stock.quantity).toBe(120);
    expect(stock.label).toBe("A · Large");
  });

  it("asks the seller to increase stock when the request is larger", () => {
    expect(
      stockShortfallMessage({
        requestedQty: 300,
        availableQty: 120,
        label: "A · Large",
        unitLabel: "trays",
      })
    ).toBe(
      "You have 120 trays of A · Large. Increase your stock before selling 300."
    );
    expect(
      stockShortfallMessage({
        requestedQty: 10,
        availableQty: 120,
        label: "A · Large",
        unitLabel: "trays",
      })
    ).toBeNull();
  });

  it("groups listings into one card per type", () => {
    const groups = groupByEggType([
      {
        name: "A",
        grade: "A",
        size: "Large",
        unit: "TRAY",
        availableQuantity: 80,
      },
      {
        name: "B",
        grade: "A",
        size: "Large",
        unit: "TRAY",
        availableQuantity: 40,
      },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.quantity).toBe(120);
    expect(groups[0]?.label).toBe("A · Large");
  });
});
