import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ManageOrders from "../pages/ManageOrders";
import api from "../api/api";

// Mock API
jest.mock("../api/api");

const mockOrders = [
  {
    id: 1,
    order_number: "ORD001",
    status: "paid",
    total: 49.99,
    created_at: "2025-05-01T12:00:00Z",
    user: { name: "John Doe", email: "john@example.com" },
    shipping_address: {
      full_name: "John Doe",
      street: "123 Elm St",
      city: "Tampa",
      state: "FL",
      zip_code: "33601",
    },
    billing_address: {
      full_name: "John Doe",
      street: "123 Elm St",
      city: "Tampa",
      state: "FL",
      zip_code: "33601",
    },
    items: [
      {
        order_item_id: 101,
        product_name: "T-Shirt",
        product_sku: "TS-001",
        variant: {
          sku: "TS-001-BLUE-M",
          color: "Blue",
          size: "M",
        },
        quantity: 2,
        price: 24.99,
        status: "paid",
        tracking_number: "",
        cancelled_quantity: 0,
        returned_quantity: 0,
      },
    ],
  },
];

describe("ManageOrders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders orders from API", async () => {
    api.get.mockResolvedValueOnce({ data: mockOrders });

    render(<ManageOrders />);

    expect(screen.getByText("Loading orders...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Order #ORD001")).toBeInTheDocument();
      expect(screen.getByText(/John Doe.*john@example\.com/i)).toBeInTheDocument();
    });
  });

  it("expands and collapses order details", async () => {
    api.get.mockResolvedValue({ data: mockOrders });

    render(<ManageOrders />);
    await screen.findByText("View Details");

    fireEvent.click(screen.getByText("View Details"));
    expect(await screen.findByText(/SKU: TS-001-BLUE-M/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Hide Details"));
    expect(screen.queryByText(/SKU: TS-001-BLUE-M/)).not.toBeInTheDocument();
  });

  it("opens cancel modal and confirms cancel", async () => {
    api.get.mockResolvedValue({ data: mockOrders });
    api.patch.mockResolvedValue({});

    render(<ManageOrders />);
    await screen.findByText("View Details");
    fireEvent.click(screen.getByText("View Details"));
    fireEvent.click(screen.getAllByText("Cancel Item")[0]);

    expect(await screen.findByRole("heading", { name: /cancel item/i })).toBeInTheDocument();

    fireEvent.click(screen.getByText("Confirm Cancel"));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        "/api/admin/orders/101/cancel",
        expect.objectContaining({ cancel_quantity: 1 })
      );
    });
  });

  it("opens return modal and submits return", async () => {
    const shippedOrder = {
      ...mockOrders[0],
      items: [
        {
          ...mockOrders[0].items[0],
          status: "shipped",
        },
      ],
    };

    api.get.mockResolvedValueOnce({ data: [shippedOrder] });
    api.post.mockResolvedValueOnce({});

    render(<ManageOrders />);
    await screen.findByText("View Details");
    fireEvent.click(screen.getByText("View Details"));
    fireEvent.click(screen.getAllByText("Request Return")[0]);

    expect(screen.getByRole("heading", { name: /request return/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Reason/i), {
      target: { value: "Wrong size" },
    });
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/returns", {
        order_item_id: 101,
        quantity: 1,
        reason: "Wrong size",
      });
    });
  });

  it("updates tracking number", async () => {
    const fulfilledOrder = {
      ...mockOrders[0],
      items: [
        {
          ...mockOrders[0].items[0],
          status: "fulfilled",
        },
      ],
    };

    api.get.mockResolvedValue({ data: [fulfilledOrder] });
    api.patch.mockResolvedValue({});

    render(<ManageOrders />);
    await screen.findByText("View Details");
    fireEvent.click(screen.getByText("View Details"));

    fireEvent.click(screen.getByText("✎"));

    const trackingInputs = screen.getAllByDisplayValue("");
    const trackingInput = trackingInputs.find((input) =>
      input.closest("li")?.textContent.includes("Tracking:")
    );

    fireEvent.change(trackingInput, { target: { value: "TRACK123" } });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/api/admin/orders/101/tracking", {
        tracking_number: "TRACK123",
      });
    });
  });

  it("search filters orders", async () => {
    api.get.mockResolvedValue({ data: mockOrders });
    render(<ManageOrders />);
    await screen.findByText("Order #ORD001");

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "ORD999" },
    });

    expect(screen.getByText("No matching orders found.")).toBeInTheDocument();
  });
});
