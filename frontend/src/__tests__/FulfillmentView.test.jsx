import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FulfillmentView from "../pages/FulfillmentView";
import { MemoryRouter } from "react-router-dom";
import api from "../api/api";

// Mock API methods
jest.mock("../api/api");

const mockOrder = {
  id: 1,
  order_number: "ABC123",
  status: "in_fulfillment",
  shipping_address: {
    full_name: "Jane Doe",
    street: "123 Main St",
    city: "Orlando",
    state: "FL",
    zip_code: "32801",
  },
  user: {
    name: "Jane Doe",
    email: "jane@example.com",
  },
  items: [
    {
      order_item_id: 101,
      product_name: "Beach Towel",
      product_sku: "BT-001",
      variant: {
        sku: "BT-001-BLUE-M",
        color: "Blue",
        size: "M",
      },
      quantity: 2,
      status: "paid",
      cancelled_quantity: 0,
      returned_quantity: 0,
    },
  ],
};

describe("FulfillmentView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading and renders fetched orders", async () => {
    api.get.mockResolvedValueOnce({ data: [mockOrder] });

    render(
      <MemoryRouter>
        <FulfillmentView />
      </MemoryRouter>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Order: ABC123")).toBeInTheDocument();
    });
  });

  it("displays empty state if no orders", async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <FulfillmentView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No orders to fulfill.")).toBeInTheDocument();
    });
  });

  it("filters orders by search input", async () => {
    api.get.mockResolvedValueOnce({ data: [mockOrder] });

    render(
      <MemoryRouter>
        <FulfillmentView />
      </MemoryRouter>
    );

    await screen.findByText("Order: ABC123");

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "no-match" },
    });

    expect(screen.getByText("No orders to fulfill.")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "abc" },
    });

    expect(screen.getByText("Order: ABC123")).toBeInTheDocument();
  });

  it("expands order and shows item actions", async () => {
    api.get.mockResolvedValueOnce({ data: [mockOrder] });

    render(
      <MemoryRouter>
        <FulfillmentView />
      </MemoryRouter>
    );

    await screen.findByText("Order: ABC123");

    fireEvent.click(screen.getByText("View Details"));

    expect(await screen.findByText(/Qty: 2/)).toBeInTheDocument();
    expect(screen.getByText("Mark as Fulfilled")).toBeInTheDocument();
    expect(screen.getByText("Mark as Backordered")).toBeInTheDocument();
  });

  it("calls fulfill API when 'Mark as Fulfilled' is clicked", async () => {
    api.get.mockResolvedValue({ data: [mockOrder] });
    api.patch.mockResolvedValue({});

    render(
      <MemoryRouter>
        <FulfillmentView />
      </MemoryRouter>
    );

    await screen.findByText("Order: ABC123");
    fireEvent.click(screen.getByText("View Details"));
    fireEvent.click(screen.getByText("Mark as Fulfilled"));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/api/admin/orders/item/101/fulfill");
    });
  });

  it("calls backorder API when 'Mark as Backordered' is clicked", async () => {
    api.get.mockResolvedValue({ data: [mockOrder] });
    api.patch.mockResolvedValue({});

    render(
      <MemoryRouter>
        <FulfillmentView />
      </MemoryRouter>
    );

    await screen.findByText("Order: ABC123");
    fireEvent.click(screen.getByText("View Details"));
    fireEvent.click(screen.getByText("Mark as Backordered"));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/api/admin/orders/item/101/backorder");
    });
  });

  it("submits tracking and ships item", async () => {
    const shippedOrder = {
      ...mockOrder,
      items: [
        {
          ...mockOrder.items[0],
          status: "fulfilled",
        },
      ],
    };

    api.get.mockResolvedValue({ data: [shippedOrder] });
    api.patch.mockResolvedValue({});

    render(
      <MemoryRouter>
        <FulfillmentView />
      </MemoryRouter>
    );

    await screen.findByText("Order: ABC123");
    fireEvent.click(screen.getByText("View Details"));

    const trackingInput = screen.getByPlaceholderText("Tracking Number");
    fireEvent.change(trackingInput, { target: { value: "TRACK123" } });

    fireEvent.click(screen.getByText("Mark as Shipped"));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/api/admin/orders/item/101/ship", {
        tracking_number: "TRACK123",
      });
    });
  });
});
