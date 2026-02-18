import type { QuoteInput, QuoteResult } from "./types";

function assertFiniteNonNegative(n: number, field: string) {
  if (!Number.isFinite(n) || n < 0) throw new Error(`${field} must be a non-negative number`);
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  assertFiniteNonNegative(input.profitPercent, "profitPercent");

  const items = input.supplies.map((s) => {
    assertFiniteNonNegative(s.unitCost, `unitCost(${s.name})`);
    assertFiniteNonNegative(s.quantity, `quantity(${s.name})`);

    const cost = s.quantity * s.unitCost;
    return { id: s.id, name: s.name, cost };
  });

  const materialsCost = items.reduce((acc, it) => acc + it.cost, 0);
  const salePriceSuggested = materialsCost * (1 + input.profitPercent / 100);

  return { materialsCost, salePriceSuggested, items };
}
