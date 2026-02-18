export type SupplyUnit = "g" | "fixed";

export type SupplyInput = {
  id: string;
  name: string;
  unit: SupplyUnit;
  unitCost: number;   // costo por gramo o costo fijo
  quantity: number;   // gramos o cantidad
};

export type QuoteInput = {
  supplies: SupplyInput[];
  profitPercent: number;
};

export type QuoteResult = {
  materialsCost: number;
  salePriceSuggested: number;
  items: Array<{
    id: string;
    name: string;
    cost: number;
  }>;
};
