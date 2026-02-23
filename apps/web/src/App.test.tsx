import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import App from "./App";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("App Component - Unit Tests", () => {
  describe("Initial Render", () => {
    it("should render title in Spanish", () => {
      render(<App />);
      expect(screen.getByText("Calculadora de Precios para Impresión 3D")).toBeInTheDocument();
    });

    it("should display profit input with default value 30", () => {
      render(<App />);
      const input = screen.getByDisplayValue("30") as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });

    it("should display supply table with Spanish headers", () => {
      render(<App />);
      expect(screen.getByText("Material")).toBeInTheDocument();
      expect(screen.getByText("Unidad")).toBeInTheDocument();
      expect(screen.getByText("Costo Unitario")).toBeInTheDocument();
      expect(screen.getByText("Cantidad")).toBeInTheDocument();
      expect(screen.getByText("Costo Total")).toBeInTheDocument();
    });

    it("should display totals section in Spanish", () => {
      render(<App />);
      expect(screen.getByText("Costo de Materiales")).toBeInTheDocument();
      expect(screen.getByText("Precio Sugerido")).toBeInTheDocument();
    });

    it("should have default supply (PLA) selected", () => {
      render(<App />);
      const selects = screen.getAllByDisplayValue("PLA");
      expect(selects.length).toBeGreaterThan(0);
    });

    it("should display action buttons in Spanish", () => {
      render(<App />);
      expect(screen.getByRole("button", { name: "Agregar Insumo" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Calcular en Servidor" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Volver a Cálculo Local" })).toBeInTheDocument();
    });

    it("should display material dropdown", () => {
      render(<App />);
      const selects = screen.getAllByRole("combobox");
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  describe("Material Selection", () => {
    it("should have PLA, PETG, ABS, ASA, TPU options", () => {
      render(<App />);
      const materialSelects = screen.getAllByDisplayValue("PLA");
      const select = materialSelects[0] as HTMLSelectElement;
      
      expect(select.options.length).toBe(5);
      expect(select.options[0].value).toBe("PLA");
      expect(select.options[1].value).toBe("PETG");
      expect(select.options[2].value).toBe("ABS");
      expect(select.options[3].value).toBe("ASA");
      expect(select.options[4].value).toBe("TPU");
    });

    it("should change material selection", () => {
      render(<App />);
      const materialSelects = screen.getAllByDisplayValue("PLA");
      const select = materialSelects[0] as HTMLSelectElement;

      fireEvent.change(select, { target: { value: "PETG" } });

      expect(screen.getByDisplayValue("PETG")).toBeInTheDocument();
    });

    it("should display selected material in table", () => {
      render(<App />);
      const materialSelects = screen.getAllByDisplayValue("PLA");
      const select = materialSelects[0] as HTMLSelectElement;

      fireEvent.change(select, { target: { value: "ABS" } });

      expect(screen.getByDisplayValue("ABS")).toBeInTheDocument();
    });
  });

  describe("Local Calculation", () => {
    it("should calculate total cost for default PLA supply", () => {
      render(<App />);
      // Default: 100g at 0.02 per gram = 2.00
      const costElements = screen.getAllByText(/\$2\.00/);
      expect(costElements.length).toBeGreaterThan(0);
    });

    it("should calculate suggested price with 30% profit", () => {
      render(<App />);
      // Default: 2.00 * 1.30 = 2.60
      expect(screen.getByText(/\$2\.60/)).toBeInTheDocument();
    });

    it("should update calculation when profit changes", () => {
      render(<App />);
      const profitInput = screen.getByDisplayValue("30") as HTMLInputElement;

      fireEvent.change(profitInput, { target: { value: "50" } });

      // 2.00 * 1.50 = 3.00
      expect(screen.getByText(/\$3\.00/)).toBeInTheDocument();
    });

    it("should update calculation when supply quantity changes", async () => {
      render(<App />);

      const quantityInputs = screen.getAllByDisplayValue("100");
      const quantityInput = quantityInputs[0] as HTMLInputElement;

      fireEvent.change(quantityInput, { target: { value: "200" } });

      await waitFor(() => {
        // 200g * 0.02 = 4.00, with 30% profit = 5.20
        expect(screen.getByText(/\$5\.20/)).toBeInTheDocument();
      });
    });

    it("should update calculation when unit cost changes", async () => {
      render(<App />);

      const costInputs = screen.getAllByDisplayValue("0.02");
      const costInput = costInputs[0] as HTMLInputElement;

      fireEvent.change(costInput, { target: { value: "0.04" } });

      await waitFor(() => {
        // 100g * 0.04 = 4.00, with 30% profit = 5.20
        expect(screen.getByText(/\$5\.20/)).toBeInTheDocument();
      });
    });
  });

  describe("Supply Management", () => {
    it("should add new supply when clicking 'Agregar Insumo'", () => {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "Agregar Insumo" }));

      // Should have 2 material dropdowns now
      const materialSelects = screen.getAllByRole("combobox");
      expect(materialSelects.length).toBeGreaterThan(1);
    });

    it("should remove supply when clicking 'Eliminar'", () => {
      render(<App />);

      const eliminateButtons = screen.getAllByRole("button", { name: "Eliminar" });
      const initialButtonCount = eliminateButtons.length;

      fireEvent.click(eliminateButtons[0]);

      const updatedButtons = screen.queryAllByRole("button", { name: "Eliminar" });
      expect(updatedButtons.length).toBeLessThan(initialButtonCount);
    });

    it("should allow multiple supplies", () => {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "Agregar Insumo" }));
      fireEvent.click(screen.getByRole("button", { name: "Agregar Insumo" }));

      const eliminateButtons = screen.getAllByRole("button", { name: "Eliminar" });
      expect(eliminateButtons.length).toBe(3); // 1 default + 2 added
    });

    it("should change supply unit from gramos to fijo", () => {
      render(<App />);

      const selects = screen.getAllByDisplayValue("gramos (g)") as HTMLSelectElement[];
      fireEvent.change(selects[0], { target: { value: "fixed" } });

      expect(screen.getByDisplayValue("fijo")).toBeInTheDocument();
    });
  });
});

describe("App Component - Integration Tests", () => {
  describe("Backend Calculation", () => {
    it("should call backend when clicking 'Calcular en Servidor'", async () => {
      const fetchMock = vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          materialsCost: 2,
          salePriceSuggested: 2.6,
          items: [{ id: "pla", name: "PLA", cost: 2 }]
        })
      } as any);

      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "Calcular en Servidor" }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });
    });

    it("should display backend results after calculation", async () => {
      vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          materialsCost: 2,
          salePriceSuggested: 2.6,
          items: [{ id: "pla", name: "PLA", cost: 2 }]
        })
      } as any);

      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "Calcular en Servidor" }));

      await waitFor(() => {
        expect(screen.getByText("servidor")).toBeInTheDocument();
        expect(screen.getByText("Desglose (Cálculo en Servidor)")).toBeInTheDocument();
      });
    });

    it("should show loading state while calculating", async () => {
      vi.spyOn(globalThis, "fetch" as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            materialsCost: 2,
            salePriceSuggested: 2.6,
            items: [{ id: "pla", name: "PLA", cost: 2 }]
          })
        }), 100))
      );

      render(<App />);

      const button = screen.getByRole("button", { name: "Calcular en Servidor" });
      fireEvent.click(button);

      expect(screen.getByRole("button", { name: "Calculando..." })).toBeInTheDocument();
    });

    it("should display error message on backend failure", async () => {
      vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Carga inválida" })
      } as any);

      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "Calcular en Servidor" }));

      await waitFor(() => {
        expect(screen.getByText("Carga inválida")).toBeInTheDocument();
      });
    });

    it("should show breakdown of backend items in Spanish", async () => {
      vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          materialsCost: 3.5,
          salePriceSuggested: 4.55,
          items: [
            { id: "pla", name: "PLA", cost: 2 },
            { id: "power", name: "Electricidad", cost: 1.5 }
          ]
        })
      } as any);

      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "Calcular en Servidor" }));

      await waitFor(() => {
        // Check that breakdown section is displayed
        expect(screen.getByText("Desglose (Cálculo en Servidor)")).toBeInTheDocument();
        // Check that list items exist with the correct number
        const listItems = screen.getAllByRole("listitem");
        expect(listItems.length).toBe(2);
        // Verify content of list items
        expect(listItems[0].textContent).toContain("PLA");
        expect(listItems[0].textContent).toContain("2.00");
        expect(listItems[1].textContent).toContain("Electricidad");
        expect(listItems[1].textContent).toContain("1.50");
      });
    });
  });

  describe("Return to Local Calculation", () => {
    it("should return to local calculation when clicking button", async () => {
      vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          materialsCost: 2,
          salePriceSuggested: 2.6,
          items: [{ id: "pla", name: "PLA", cost: 2 }]
        })
      } as any);

      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "Calcular en Servidor" }));

      await waitFor(() => {
        expect(screen.getByText("servidor")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Volver a Cálculo Local" }));

      await waitFor(() => {
        expect(screen.getByText("local")).toBeInTheDocument();
      });
    });
  });

  describe("Source Display", () => {
    it("should show 'local' as source initially", () => {
      render(<App />);
      expect(screen.getByText("local")).toBeInTheDocument();
    });

    it("should change source to 'servidor' after backend calculation", async () => {
      vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          materialsCost: 2,
          salePriceSuggested: 2.6,
          items: [{ id: "pla", name: "PLA", cost: 2 }]
        })
      } as any);

      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "Calcular en Servidor" }));

      await waitFor(() => {
        expect(screen.getByText("servidor")).toBeInTheDocument();
      });
    });
  });
});
