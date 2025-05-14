import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InventoryManager from "../pages/InventoryManager";
import api from "../api/api";

// Mock API
jest.mock("../api/api");

const mockVariants = [
  {
    id: 1,
    sku: "SKU-001",
    color: "Blue",
    size: "M",
    quantity: 3,
  },
  {
    id: 2,
    sku: "SKU-002",
    color: "Red",
    size: "L",
    quantity: 2,
  },
];

describe("InventoryManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders initial low stock variants", async () => {
    api.get.mockResolvedValueOnce({ data: mockVariants });

    render(<InventoryManager />);

    expect(screen.getByText("Inventory Manager")).toBeInTheDocument();
    expect(screen.getByLabelText("Threshold:")).toHaveValue(5);

    await waitFor(() => {
      expect(screen.getByText("SKU-001")).toBeInTheDocument();
      expect(screen.getByText("Blue")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith("/api/admin/alerts/low-stock?threshold=5");
  });

  it("shows empty state if no variants returned", async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    render(<InventoryManager />);

    await waitFor(() => {
      expect(screen.getByText("No variants below threshold.")).toBeInTheDocument();
    });
  });

  it("fetches new data when threshold is changed", async () => {
    api.get.mockResolvedValue({ data: mockVariants });

    render(<InventoryManager />);

    const input = screen.getByLabelText("Threshold:");
    fireEvent.change(input, { target: { value: "2" } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/admin/alerts/low-stock?threshold=2");
    });
  });

  it("renders table with variant data", async () => {
    api.get.mockResolvedValueOnce({ data: mockVariants });

    render(<InventoryManager />);

    await waitFor(() => {
      expect(screen.getByText("SKU-002")).toBeInTheDocument();
      expect(screen.getByText("Red")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2 variants
  });
});
