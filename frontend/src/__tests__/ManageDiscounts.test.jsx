import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import ManageDiscounts from "../pages/ManageDiscounts";
import api from "../api/api";

// Mock API
jest.mock("../api/api");

const mockCoupons = [
  {
    id: 1,
    code: "SAVE10",
    type: "percent",
    amount: 10,
    expires_at: "2025-12-31T23:59",
    times_used: 0,
    max_uses: 5,
  },
];

const mockSales = [
  {
    id: 1,
    name: "Summer Sale",
    discount_type: "percent",
    discount_value: 20,
    category: "T-Shirts",
    variant_ids: ["TS-001", "TS-002"],
  },
];

describe("ManageDiscounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders and fetches coupons and sales", async () => {
    api.get.mockImplementation((url) => {
      if (url.includes("coupons")) return Promise.resolve({ data: mockCoupons });
      if (url.includes("sales")) return Promise.resolve({ data: mockSales });
      return Promise.resolve({ data: [] });
    });

    render(<ManageDiscounts />);

    // Coupon
    expect(await screen.findByText("SAVE10")).toBeInTheDocument();

    // Sale name inside a <strong>, then verify parent <li>
    const saleName = await screen.findByText("Summer Sale", { selector: "strong" });
    expect(saleName).toBeInTheDocument();
  });

  it("creates a coupon", async () => {
    api.get.mockResolvedValue({ data: [] });
    api.post.mockResolvedValue({});
    render(<ManageDiscounts />);

    fireEvent.change(screen.getByLabelText(/Code/i), { target: { value: "WELCOME" } });
    fireEvent.change(screen.getByLabelText(/Discount Amount/i), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText(/Minimum Order Value/i), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText(/Expiration Date/i), {
      target: { value: "2025-12-31T23:59" },
    });
    fireEvent.change(screen.getByLabelText(/Max Uses/i), { target: { value: "2" } });

    fireEvent.click(screen.getByRole("button", { name: /Create Coupon/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/admin/discounts/coupons", expect.objectContaining({
        code: "WELCOME",
        amount: 5,
        min_order_value: 20,
        expires_at: "2025-12-31T23:59",
        max_uses: 2,
      }));
    });
  });

  it("deletes a coupon", async () => {
    api.get.mockResolvedValue({ data: mockCoupons });
    api.delete.mockResolvedValue({});

    render(<ManageDiscounts />);

    await screen.findByText("SAVE10");

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]); // delete the first (coupon)

    await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith("/api/admin/discounts/coupons/1");
    });
  });


  it("creates a sale", async () => {
    api.get.mockResolvedValue({ data: [] });
    api.post.mockResolvedValue({});
    render(<ManageDiscounts />);

    fireEvent.change(screen.getByLabelText(/Sale Name/i), { target: { value: "Winter Blast" } });
    fireEvent.change(screen.getByLabelText(/Discount Value/i), { target: { value: "15" } });
    fireEvent.change(screen.getByLabelText(/Start Date/i), {
      target: { value: "2025-01-01T00:00" },
    });
    fireEvent.change(screen.getByLabelText(/End Date/i), {
      target: { value: "2025-02-01T00:00" },
    });
    fireEvent.change(screen.getByLabelText(/Variant SKUs/i), {
      target: { value: "SKU1, SKU2" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create Sale/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/admin/discounts/sales", expect.objectContaining({
        name: "Winter Blast",
        discount_value: 15,
        variant_skus: ["SKU1", "SKU2"],
        category: "", // "All" becomes empty string
      }));
    });
  });

  it("deletes a sale", async () => {
    api.get.mockResolvedValue({ data: mockSales });
    api.delete.mockResolvedValue({});

    render(<ManageDiscounts />);

    const saleName = await screen.findByText("Summer Sale", { selector: "strong" });
    const saleListItem = saleName.closest("li");
    expect(saleListItem).toBeInTheDocument();

    const deleteButton = within(saleListItem).getByText("Delete");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/api/admin/discounts/sales/1");
    });
  });
});
