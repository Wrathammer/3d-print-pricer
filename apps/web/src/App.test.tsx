import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import App from "./App";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("App Component - Unit Tests", () => {
  describe("Initial Render", () => {
    it("should render title", () => {
      render(<App />);
      expect(screen.getByText("3D Print Pricer")).toBeInTheDocument();
    });

    it("should display profit input with default value 30", () => {
      render(<App />);
      const input = screen.getByDisplayValue("30") as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });

    it("should display supply table", () => {
      render(<App />);
      expect(screen.getByText("Insumo")).toBeInTheDocument();
      expect(screen.getByText("Unidad")).toBeInTheDocument();
      expect(screen.getByText("Costo unitario")).toBeInTheDocument();
      expect(screen.getByText("Cantidad")).toBeInTheDocument();
      expect(screen.getByText("Costo")).toBeInTheDocument();
    });

    it("should display totals section", () => {
      render(<App />);
      expect(screen.getByText("Costo materiales")).toBeInTheDocument();
      expect(screen.getByText("Precio sugerido")).toBeInTheDocument();
    });

    it("should have default supply (PLA) in table", () => {
      render(<App />);
      const inputs = screen.getAllByDisplayValue("PLA");
      expect(inputs.length).toBeGreaterThan(0);
    });

    it("should display action buttons", () => {
      render(<App />);
      expect(screen.getByRole("button", { name: "Agregar insumo" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Calcular vía backend" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Volver a cálculo local" })).toBeInTheDocument();
    });
  });

  describe("Local Calculation", () => {
    it("should calculate total cost for default PLA supply", () => {
      render(<App />);
      // Default: 100g at 0.02 per gram = 2.00
      const costElements = screen.getAllByText("2.00");
      expect(costElements.length).toBeGreaterThan(0);
    });

    it("should calculate suggested price with 30% profit", () => {
      render(<App />);
      // Default: 2.00 * 1.30 = 2.60
      expect(screen.getByText("2.60")).toBeInTheDocument();
    });

    it("should update calculation when profit changes", () => {
      render(<App />);
      const profitInput = screen.getByDisplayValue("30") as HTMLInputElement;

      // Change profit to 50%
      fireEvent.change(profitInput, { target: { value: "50" } });

      // 2.00 * 1.50 = 3.00
      expect(screen.getByText("3.00")).toBeInTheDocument();
    });

    it("should update calculation when supply quantity changes", async () => {
      render(<App />);

      const quantityInputs = screen.getAllByDisplayValue("100");
      const quantityInput = quantityInputs[0] as HTMLInputElement;

      // Change quantity to 200g
      fireEvent.change(quantityInput, { target: { value: "200" } });

      await waitFor(() => {
        // 200g * 0.02 = 4.00, with 30% profit = 5.20
        expect(screen.getByText("5.20")).toBeInTheDocument();
      });
    });

    it("should update calculation when unit cost changes", async () => {
      render(<App />);

      const costInputs = screen.getAllByDisplayValue("0.02");
      const costInput = costInputs[0] as HTMLInputElement;

      // Change unit cost to 0.04
      fireEvent.change(costInput, { target: { value: "0.04" } });

      await waitFor(() => {
        // 100g * 0.04 = 4.00, with 30% profit = 5.20
        expect(screen.getByText("5.20")).toBeInTheDocument();
      });
    });

    it("should update calculation when supply name changes", async () => {
      render(<App />);

      const nameInputs = screen.getAllByDisplayValue("PLA");
      const nameInput = nameInputs[0] as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: "PETG" } });

      await waitFor(() => {
        expect(screen.getByDisplayValue("PETG")).toBeInTheDocument();
      });
    });
  });

  describe("Supply Management", () => {
    it("should add new supply when clicking 'Agregar insumo'", () => {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "Agregar insumo" }));

      // Should have "Nuevo" as default name for new supply
      expect(screen.getByDisplayValue("Nuevo")).toBeInTheDocument();
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

      // Add multiple supplies
      fireEvent.click(screen.getByRole("button", { name: "Agregar insumo" }));
      fireEvent.click(screen.getByRole("button", { name: "Agregar insumo" }));

      const eliminateButtons = screen.getAllByRole("button", { name: "Eliminar" });
      expect(eliminateButtons.length).toBe(3); // 1 default + 2 added
    });

    it("should change supply unit from 'g' to 'fixed'", () => {
      render(<App />);

      const selects = screen.getAllByDisplayValue("g") as HTMLSelectElement[];
      fireEvent.change(selects[0], { target: { value: "fixed" } });

      expect(selects[0].value).toBe("fixed");
    });
  });
});

describe("App Component - Integration Tests", () => {
  describe("Backend Calculation", () => {
    it("should call backend when clicking 'Calcular vía backend'", async () => {
      const fetchMock = vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          materialsCost: 2,
          salePriceSuggested: 2.6,
          items: [{ id: "pla", name: "PLA", cost: 2 }]
        })
      } as any);

      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "Calcular vía backend" }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/quote",
          expect.objectContaining({
            method: "POST",
            headers: { "content-type": "application/json" }
          })
        );
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

      fireEvent.click(screen.getByRole("button", { name: "Calcular vía backend" }));

      await waitFor(() => {
        expect(screen.getByText("backend")).toBeInTheDocument();
        expect(screen.getByText("Breakdown (backend)")).toBeInTheDocument();
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

      const button = screen.getByRole("button", { name: "Calcular vía backend" });
      fireEvent.click(button);

      // Button should show loading state
      expect(screen.getByRole("button", { name: "Calculando..." })).toBeInTheDocument();
    });

    it("should display error message on backend failure", async () => {
      vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Invalid payload" })
      } as any);

      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "Calcular vía backend" }));

      await waitFor(() => {
        expect(screen.getByText("Invalid payload")).toBeInTheDocument();
      });
    });

    it("should show breakdown of backend items", async () => {
      vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          materialsCost: 3.5,
          salePriceSuggested: 4.55,
          items: [
            { id: "pla", name: "PLA", cost: 2 },
            { id: "power", name: "Electricity", cost: 1.5 }
          ]
        })
      } as any);

      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "Calcular vía backend" }));

      await waitFor(() => {
        expect(screen.getByText(/PLA: 2\.00/)).toBeInTheDocument();
        expect(screen.getByText(/Electricity: 1\.50/)).toBeInTheDocument();
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

      // Calculate via backend
      fireEvent.click(screen.getByRole("button", { name: "Calcular vía backend" }));

      await waitFor(() => {
        expect(screen.getByText("backend")).toBeInTheDocument();
      });

      // Return to local
      fireEvent.click(screen.getByRole("button", { name: "Volver a cálculo local" }));

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

    it("should change source to 'backend' after backend calculation", async () => {
      vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          materialsCost: 2,
          salePriceSuggested: 2.6,
          items: [{ id: "pla", name: "PLA", cost: 2 }]
        })
      } as any);

      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "Calcular vía backend" }));

      await waitFor(() => {
        expect(screen.getByText("backend")).toBeInTheDocument();
      });
    });
  });
});
