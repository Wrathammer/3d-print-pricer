import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app";

describe("POST /quote", () => {
  it("returns quote", async () => {
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
  });

  it("400 on invalid payload", async () => {
    const app = buildApp();

    const res = await app.inject({
      method: "POST",
      url: "/quote",
      payload: { profitPercent: -1, supplies: [] }
    });

    expect(res.statusCode).toBe(400);
  });
});
