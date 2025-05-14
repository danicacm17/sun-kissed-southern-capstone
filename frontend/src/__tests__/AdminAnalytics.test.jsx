import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AdminAnalytics from "../pages/AdminAnalytics";
import * as api from "../api/api";

// Mock the API module
jest.mock("../api/api");

describe("📊 AdminAnalytics", () => {
  beforeEach(() => {
    api.default.get.mockResolvedValue({
      data: {
        orders_by_location: [
          { city: "Miami", count: 12 },
          { city: "Tampa", count: 9 },
        ],
        revenue_by_day: [
          { date: "2025-05-10", revenue: 120.5 },
          { date: "2025-05-11", revenue: 200.0 },
        ],
        top_customers: [
          { first_name: "Danica", last_name: "Murphy", total_spent: 750 },
          { first_name: "Ava", last_name: "Smith", total_spent: 620 },
        ],
        low_stock_alerts: [
          {
            product_id: 1,
            product_name: "Sun Tee",
            product_sku: "ST001",
            sku: "ST001-BLU-M",
            color: "Blue",
            size: "M",
            quantity: 2,
          },
        ],
        fulfillment_summary: [
          {
            order_number: 1001,
            recipient: "Danica Murphy",
            quantity: 2,
            price: 25.0,
          },
        ],
      },
    });
  });

  it("renders analytics sections", async () => {
    render(<AdminAnalytics />);

    expect(screen.getByText(/Loading analytics/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Orders by Location/i)).toBeInTheDocument();
      expect(screen.getByText(/Revenue by Day/i)).toBeInTheDocument();
      expect(screen.getByText(/Top Customers/i)).toBeInTheDocument();
      expect(screen.getByText(/Low Stock Alerts/i)).toBeInTheDocument();
      expect(screen.getByText(/Fulfillment Summary/i)).toBeInTheDocument();
    });
  });

  it("displays orders by location", async () => {
    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText("Miami: 12")).toBeInTheDocument();
      expect(screen.getByText("Tampa: 9")).toBeInTheDocument();
    });
  });

  it("shows top customers", async () => {
    render(<AdminAnalytics />);

    await waitFor(() => {
      const customers = screen.getByText("Top Customers").nextSibling;
      expect(customers).toHaveTextContent("Danica Murphy");
      expect(customers).toHaveTextContent("$750.00");
    });
  });

  it("handles empty fulfillment gracefully", async () => {
    api.default.get.mockResolvedValueOnce({
      data: {
        orders_by_location: [],
        revenue_by_day: [],
        top_customers: [],
        low_stock_alerts: [],
        fulfillment_summary: [],
      },
    });

    render(<AdminAnalytics />);
    await waitFor(() => {
      expect(screen.getByText("All orders have been fulfilled.")).toBeInTheDocument();
    });
  });
});
