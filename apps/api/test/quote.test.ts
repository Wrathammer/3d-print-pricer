import { describe, expect, it, beforeAll } from "vitest";
import { buildApp } from "../src/app";

describe("API - Quote Endpoint Integration Tests", () => {
  describe("POST /quote - Success Cases", () => {
    it("should return 200 with correct calculation for single supply", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        payload: {
          profitPercent: 30,
          supplies: [
            { id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 }
          ]
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.materialsCost).toBeCloseTo(2, 10);
      expect(body.salePriceSuggested).toBeCloseTo(2.6, 10);
      expect(body.items).toHaveLength(1);
    });

    it("should handle multiple supplies", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        payload: {
          profitPercent: 25,
          supplies: [
            { id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 150 },
            { id: "power", name: "Electricity", unit: "fixed", unitCost: 0.5, quantity: 1 }
          ]
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.materialsCost).toBeCloseTo(150 * 0.02 + 0.5, 10);
      expect(body.items).toHaveLength(2);
    });

    it("should apply profit percentage correctly", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        payload: {
          profitPercent: 50,
          supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 1, quantity: 100 }]
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.salePriceSuggested).toBeCloseTo(150, 10);
    });

    it("should include item breakdown", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        payload: {
          profitPercent: 0,
          supplies: [
            { id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 },
            { id: "resin", name: "Resin", unit: "g", unitCost: 0.05, quantity: 50 }
          ]
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.items).toHaveLength(2);
      expect(body.items[0].name).toBe("PLA");
      expect(body.items[0].cost).toBeCloseTo(2, 10);
      expect(body.items[1].name).toBe("Resin");
      expect(body.items[1].cost).toBeCloseTo(2.5, 10);
    });
  });

  describe("POST /quote - Validation Errors", () => {
    it("should return 400 for negative profit percent", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        payload: {
          profitPercent: -10,
          supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 }]
        }
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.error).toBeDefined();
    });

    it("should return 400 for empty supplies array", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        payload: {
          profitPercent: 25,
          supplies: []
        }
      });

      expect(res.statusCode).toBe(400);
    });

    it("should return 400 for missing required fields", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        payload: {
          profitPercent: 25
          // missing supplies
        }
      });

      expect(res.statusCode).toBe(400);
    });

    it("should return 400 for invalid supply unit", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        payload: {
          profitPercent: 25,
          supplies: [
            { id: "pla", name: "PLA", unit: "invalid", unitCost: 0.02, quantity: 100 }
          ]
        }
      });

      expect(res.statusCode).toBe(400);
    });

    it("should return 400 for non-numeric values", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        payload: {
          profitPercent: "not a number",
          supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 }]
        }
      });

      expect(res.statusCode).toBe(400);
    });

    it("should return 400 for missing supply id", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        payload: {
          profitPercent: 25,
          supplies: [
            { name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 }
          ]
        }
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /health - Health Check", () => {
    it("should return 200 with ok: true", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "GET",
        url: "/health"
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.ok).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero profit percent", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        payload: {
          profitPercent: 0,
          supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 1, quantity: 100 }]
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.salePriceSuggested).toBe(body.materialsCost);
    });

    it("should handle very large numbers", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        payload: {
          profitPercent: 100,
          supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 10000, quantity: 5000 }]
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.materialsCost).toBe(50000000);
    });

    it("should handle decimal quantities", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        payload: {
          profitPercent: 25,
          supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 100.5 }]
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.materialsCost).toBeCloseTo(2.01, 10);
    });
  });

  describe("Content-Type and Headers", () => {
    it("should accept application/json content type", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        headers: { "content-type": "application/json" },
        payload: {
          profitPercent: 25,
          supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 }]
        }
      });

      expect(res.statusCode).toBe(200);
    });

    it("should return application/json response", async () => {
      const app = buildApp();

      const res = await app.inject({
        method: "POST",
        url: "/quote",
        payload: {
          profitPercent: 25,
          supplies: [{ id: "pla", name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 }]
        }
      });

      expect(res.headers["content-type"]).toContain("application/json");
    });
  });
});
