import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ManageReturns from "../pages/ManageReturns";
import api from "../api/api";

jest.mock("../api/api");

const mockReturns = [
  {
    id: 1,
    status: "Requested",
    reason: "Too small",
    quantity: 1,
    refund_amount: 20.0,
    product_name: "T-Shirt",
    variant_color: "Blue",
    variant_size: "M",
    variant_sku: "TSHIRT001-BLUE-M",
    product_sku: "TSHIRT001",
    user_name: "John Doe",
    user_email: "john@example.com",
    order_number: "ORD123",
    billing_address: {
      street: "123 Elm St",
      city: "Tampa",
      state: "FL",
      zip_code: "33601",
      country: "USA"
    },
    created_at: "2025-05-01T12:00:00Z",
  }
];

describe("ManageReturns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: mockReturns });
  });

  test("renders return requests", async () => {
    render(<ManageReturns />);
    expect(screen.getByText(/Manage Returns/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Return #1/)).toBeInTheDocument();
      expect(screen.getByText(/Too small/)).toBeInTheDocument();
      expect(screen.getByText(/T-Shirt/)).toBeInTheDocument();
      expect(screen.getByText(/Blue/)).toBeInTheDocument();
    });
  });

  test("filters by status", async () => {
    render(<ManageReturns />);
    await waitFor(() => screen.getByText(/Return #1/));
    userEvent.selectOptions(screen.getByLabelText(/Filter by Status/i), "Requested");
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/admin/returns", {
        params: { status: "Requested" }
      });
    });
  });

  test("searches by product", async () => {
    render(<ManageReturns />);
    await waitFor(() => screen.getByText(/Return #1/));
    userEvent.type(screen.getByPlaceholderText(/Search by product/i), "T-Shirt");
    expect(await screen.findByText(/T-Shirt/)).toBeInTheDocument();
  });

  test("marks return as received", async () => {
    render(<ManageReturns />);
    await waitFor(() => screen.getByText(/Mark Received/));
    userEvent.click(screen.getByText(/Mark Received/));
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/api/returns/1/receive", null);
    });
  });

  test("denies a requested return", async () => {
    render(<ManageReturns />);
    await waitFor(() => screen.getByText(/Deny/));
    userEvent.click(screen.getByText(/Deny/));
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/api/admin/returns/1", {
        status: "Denied",
        restock: false
      });
    });
  });

  test("reopens a denied return", async () => {
    const deniedReturn = { ...mockReturns[0], status: "Denied" };
    api.get.mockResolvedValue({ data: [deniedReturn] });

    render(<ManageReturns />);
    await waitFor(() => screen.getByText(/Reopen Request/));
    userEvent.click(screen.getByText(/Reopen Request/));
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/api/returns/1/reopen", null);
    });
  });

  test("processes a refund with restock", async () => {
    const receivedReturn = { ...mockReturns[0], status: "Received" };
    api.get.mockResolvedValue({ data: [receivedReturn] });

    render(<ManageReturns />);
    await waitFor(() => screen.getByText(/Restock item/));
    userEvent.click(screen.getByLabelText(/Restock item/));
    userEvent.click(screen.getByText(/Process Refund/));
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/api/admin/returns/1", {
        status: "Refunded",
        restock: true
      });
    });
  });

  test("displays no return requests", async () => {
    api.get.mockResolvedValue({ data: [] });
    render(<ManageReturns />);
    await waitFor(() => {
      expect(screen.getByText(/No return requests/i)).toBeInTheDocument();
    });
  });

  test("paginates results", async () => {
    const manyReturns = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      status: "Requested",
      reason: "Too small",
      quantity: 1,
      refund_amount: 20.0,
      product_name: "T-Shirt",
      variant_color: "Blue",
      variant_size: "M",
      variant_sku: "TSHIRT001-BLUE-M",
      product_sku: "TSHIRT001",
      user_name: "John Doe",
      user_email: "john@example.com",
      order_number: `ORD${i + 1}`,
      billing_address: {
        street: "123 Elm St",
        city: "Tampa",
        state: "FL",
        zip_code: "33601",
        country: "USA",
      },
    }));

    api.get.mockResolvedValue({ data: manyReturns });

    render(<ManageReturns />);

    await waitFor(() =>
      expect(screen.getAllByText((_, el) =>
        el.tagName === "STRONG" && el.textContent.trim() === "Return #1"
      ).length).toBeGreaterThan(0)
    );

    userEvent.click(screen.getByText("Next"));

    await waitFor(() =>
      expect(screen.getAllByText((_, el) =>
        el.tagName === "STRONG" && el.textContent.trim() === "Return #11"
      ).length).toBeGreaterThan(0)
    );
  });
});
