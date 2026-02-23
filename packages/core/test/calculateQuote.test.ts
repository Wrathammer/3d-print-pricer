import { describe, expect, it } from "vitest";
import { calculateQuote, type QuoteInput } from "../src/calculateQuote";

describe("calculateQuote - Unit Tests", () => {
  describe("Basic Calculation", () => {
    it("should calculate single supply cost correctly", () => {
      const input: QuoteInput = {
        profitPercent: 0,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 }]
      };

      const result = calculateQuote(input);

      expect(result.materialsCost).toBeCloseTo(2, 10);
      expect(result.salePriceSuggested).toBeCloseTo(2, 10);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].cost).toBeCloseTo(2, 10);
    });

    it("should sum multiple supplies correctly", () => {
      const input: QuoteInput = {
        profitPercent: 0,
        supplies: [
          { id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 150 },
          { id: "power", name: "Electricity", unit: "fixed", unitCost: 0.5, quantity: 1 },
          { id: "resin", name: "Resin", unit: "g", unitCost: 0.05, quantity: 200 }
        ]
      };

      const result = calculateQuote(input);

      expect(result.materialsCost).toBeCloseTo(0.02 * 150 + 0.5 + 0.05 * 200, 10);
      expect(result.items).toHaveLength(3);
    });

    it("should calculate material cost before applying profit", () => {
      const input: QuoteInput = {
        profitPercent: 0,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 1, quantity: 10 }]
      };

      const result = calculateQuote(input);

      expect(result.materialsCost).toBe(10);
      expect(result.salePriceSuggested).toBe(10);
    });
  });

  describe("Profit Margin Calculation", () => {
    it("should apply 25% profit correctly", () => {
      const input: QuoteInput = {
        profitPercent: 25,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 }]
      };

      const result = calculateQuote(input);

      expect(result.materialsCost).toBeCloseTo(2, 10);
      expect(result.salePriceSuggested).toBeCloseTo(2.5, 10);
    });

    it("should apply 50% profit correctly", () => {
      const input: QuoteInput = {
        profitPercent: 50,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 1, quantity: 100 }]
      };

      const result = calculateQuote(input);

      expect(result.salePriceSuggested).toBeCloseTo(150, 10);
    });

    it("should apply 0% profit (no markup)", () => {
      const input: QuoteInput = {
        profitPercent: 0,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 1, quantity: 100 }]
      };

      const result = calculateQuote(input);

      expect(result.salePriceSuggested).toBe(result.materialsCost);
    });

    it("should apply 100% profit (double the price)", () => {
      const input: QuoteInput = {
        profitPercent: 100,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 1, quantity: 100 }]
      };

      const result = calculateQuote(input);

      expect(result.salePriceSuggested).toBeCloseTo(200, 10);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero quantity", () => {
      const input: QuoteInput = {
        profitPercent: 25,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 0 }]
      };

      const result = calculateQuote(input);

      expect(result.materialsCost).toBe(0);
      expect(result.salePriceSuggested).toBe(0);
    });

    it("should handle zero unit cost", () => {
      const input: QuoteInput = {
        profitPercent: 25,
        supplies: [{ id: "waste", name: "Waste", unit: "g", unitCost: 0, quantity: 100 }]
      };

      const result = calculateQuote(input);

      expect(result.materialsCost).toBe(0);
    });

    it("should handle very small decimal numbers", () => {
      const input: QuoteInput = {
        profitPercent: 25,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.0001, quantity: 1.5 }]
      };

      const result = calculateQuote(input);

      expect(result.materialsCost).toBeCloseTo(0.00015, 10);
    });

    it("should handle very large numbers", () => {
      const input: QuoteInput = {
        profitPercent: 25,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 1000, quantity: 5000 }]
      };

      const result = calculateQuote(input);

      expect(result.materialsCost).toBe(5000000);
      expect(result.salePriceSuggested).toBeCloseTo(6250000, 10);
    });
  });

  describe("Input Validation", () => {
    it("should throw on negative profit percent", () => {
      const input: QuoteInput = {
        profitPercent: -10,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 }]
      };

      expect(() => calculateQuote(input)).toThrow("profitPercent must be a non-negative number");
    });

    it("should throw on negative unit cost", () => {
      const input: QuoteInput = {
        profitPercent: 25,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: -0.02, quantity: 100 }]
      };

      expect(() => calculateQuote(input)).toThrow();
    });

    it("should throw on negative quantity", () => {
      const input: QuoteInput = {
        profitPercent: 25,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: -100 }]
      };

      expect(() => calculateQuote(input)).toThrow();
    });

    it("should throw on NaN profit percent", () => {
      const input = {
        profitPercent: NaN,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 }]
      } as any;

      expect(() => calculateQuote(input)).toThrow();
    });

    it("should throw on Infinity values", () => {
      const input = {
        profitPercent: Infinity,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 }]
      } as any;

      expect(() => calculateQuote(input)).toThrow();
    });
  });

  describe("Return Value Structure", () => {
    it("should return correct structure", () => {
      const input: QuoteInput = {
        profitPercent: 25,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 }]
      };

      const result = calculateQuote(input);

      expect(result).toHaveProperty("materialsCost");
      expect(result).toHaveProperty("salePriceSuggested");
      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should return items with correct structure", () => {
      const input: QuoteInput = {
        profitPercent: 25,
        supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 }]
      };

      const result = calculateQuote(input);

      expect(result.items[0]).toHaveProperty("id", "pla");
      expect(result.items[0]).toHaveProperty("name", "PLA");
      expect(result.items[0]).toHaveProperty("cost");
    });

    it("should preserve supply IDs in items", () => {
      const supplies = [
        { id: "pla", name: "PLA", unit: "g" as const, unitCost: 0.02, quantity: 100 },
        { id: "power", name: "Power", unit: "fixed" as const, unitCost: 0.5, quantity: 1 }
      ];

      const result = calculateQuote({ profitPercent: 0, supplies });

      expect(result.items[0].id).toBe("pla");
      expect(result.items[1].id).toBe("power");
    });
  });
});
