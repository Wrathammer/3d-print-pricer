import { useMemo, useState } from "react";
import { calculateQuote, type QuoteResult, type SupplyInput } from "@app/core";

const uid = () => Math.random().toString(36).slice(2);

async function fetchQuote(payload: { supplies: SupplyInput[]; profitPercent: number }) {
  const res = await fetch("/api/quote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "Error calculando en backend");
  }

  return (await res.json()) as QuoteResult;
}

export default function App() {
  const [profitPercent, setProfitPercent] = useState(30);
  const [supplies, setSupplies] = useState<SupplyInput[]>([
    { id: uid(), name: "PLA", unit: "g", unitCost: 0.02, quantity: 100 }
  ]);

  // cálculo local (core)
  const localQuote = useMemo(() => {
    try {
      return calculateQuote({ supplies, profitPercent });
    } catch {
      return null;
    }
  }, [supplies, profitPercent]);

  // estado para backend
  const [backendQuote, setBackendQuote] = useState<QuoteResult | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const addSupply = () => {
    setSupplies((s) => [
      ...s,
      { id: uid(), name: "Nuevo", unit: "g", unitCost: 0, quantity: 0 }
    ]);
  };

  const updateSupply = (id: string, patch: Partial<SupplyInput>) => {
    setSupplies((s) => s.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeSupply = (id: string) => setSupplies((s) => s.filter((it) => it.id !== id));

  const calculateViaBackend = async () => {
    setIsCalculating(true);
    setBackendError(null);

    try {
      const result = await fetchQuote({ supplies, profitPercent });
      setBackendQuote(result);
    } catch (e) {
      setBackendQuote(null);
      setBackendError((e as Error).message);
    } finally {
      setIsCalculating(false);
    }
  };

  const shownQuote = backendQuote ?? localQuote;

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1>3D Print Pricer</h1>

      <div style={{ display: "flex", gap: 16, alignItems: "center", margin: "16px 0", flexWrap: "wrap" }}>
        <label>
          Ganancia (%):{" "}
          <input
            type="number"
            value={profitPercent}
            min={0}
            onChange={(e) => setProfitPercent(Number(e.target.value))}
          />
        </label>

        <button onClick={addSupply}>Agregar insumo</button>

        <button onClick={calculateViaBackend} disabled={isCalculating}>
          {isCalculating ? "Calculando..." : "Calcular vía backend"}
        </button>

        <button
          onClick={() => {
            setBackendQuote(null);
            setBackendError(null);
          }}
          disabled={!backendQuote && !backendError}
        >
          Volver a cálculo local
        </button>

        <span style={{ opacity: 0.8 }}>
          Fuente: <b>{backendQuote ? "backend" : "local"}</b>
        </span>
      </div>

      {backendError && (
        <div style={{ background: "#fee", border: "1px solid #f99", padding: 12, borderRadius: 8, marginBottom: 12 }}>
          {backendError}
        </div>
      )}

      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Insumo</th>
            <th align="left">Unidad</th>
            <th align="left">Costo unitario</th>
            <th align="left">Cantidad</th>
            <th align="left">Costo</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {supplies.map((s) => {
            const cost = s.quantity * s.unitCost;
            return (
              <tr key={s.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>
                  <input value={s.name} onChange={(e) => updateSupply(s.id, { name: e.target.value })} />
                </td>
                <td>
                  <select value={s.unit} onChange={(e) => updateSupply(s.id, { unit: e.target.value as any })}>
                    <option value="g">g</option>
                    <option value="fixed">fixed</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={s.unitCost}
                    min={0}
                    step="0.0001"
                    onChange={(e) => updateSupply(s.id, { unitCost: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={s.quantity}
                    min={0}
                    step="0.1"
                    onChange={(e) => updateSupply(s.id, { quantity: Number(e.target.value) })}
                  />
                </td>
                <td>{Number.isFinite(cost) ? cost.toFixed(2) : "-"}</td>
                <td>
                  <button onClick={() => removeSupply(s.id)}>Eliminar</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
        <div>
          <div><b>Costo materiales</b></div>
          <div style={{ fontSize: 24 }}>{shownQuote ? shownQuote.materialsCost.toFixed(2) : "-"}</div>
        </div>
        <div>
          <div><b>Precio sugerido</b></div>
          <div style={{ fontSize: 24 }}>{shownQuote ? shownQuote.salePriceSuggested.toFixed(2) : "-"}</div>
        </div>
      </div>

      {backendQuote && (
        <div style={{ marginTop: 16, opacity: 0.85 }}>
          <div><b>Breakdown (backend)</b></div>
          <ul>
            {backendQuote.items.map((it) => (
              <li key={it.id}>
                {it.name}: {it.cost.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
