import { describe, expect, it } from "vitest";
import { calculateQuote } from "../src/calculateQuote";

describe("calculateQuote", () => {
  it("sums multiple supplies and applies profit %", () => {
    const res = calculateQuote({
      profitPercent: 25,
      supplies: [
        { id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 150 },
        { id: "power", name: "Electricidad", unit: "fixed", unitCost: 0.5, quantity: 1 }
      ]
    });

    expect(res.materialsCost).toBeCloseTo(150 * 0.02 + 0.5, 10);
    expect(res.salePriceSuggested).toBeCloseTo(res.materialsCost * 1.25, 10);
    expect(res.items).toHaveLength(2);
  });

  it("throws on negatives", () => {
    expect(() =>
      calculateQuote({
        profitPercent: 10,
        supplies: [{ id: "x", name: "PLA", unit: "g", unitCost: -1, quantity: 10 }]
      })
    ).toThrow();
  });
});
