import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";

beforeEach(() => {
  vi.restoreAllMocks();
});

it("renders totals", () => {
  render(<App />);
  expect(screen.getByText("Costo materiales")).toBeInTheDocument();
  expect(screen.getByText("Precio sugerido")).toBeInTheDocument();
});

it("calculates via backend when clicking the button", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
    ok: true,
    json: async () => ({
      materialsCost: 10,
      salePriceSuggested: 13,
      items: [{ id: "pla", name: "PLA", cost: 10 }]
    })
  } as any);

  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: "Calcular vía backend" }));

  await waitFor(() => {
    expect(screen.getByText("Fuente:")).toBeInTheDocument();
    expect(screen.getByText("backend")).toBeInTheDocument();
  });

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(await screen.findByText("Breakdown (backend)")).toBeInTheDocument();
});

it("shows error if backend returns non-200", async () => {
  vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Invalid payload" })
  } as any);

  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: "Calcular vía backend" }));

  expect(await screen.findByText("Invalid payload")).toBeInTheDocument();
});
