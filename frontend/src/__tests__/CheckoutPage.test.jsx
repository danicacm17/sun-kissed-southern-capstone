import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CheckoutPage from "../pages/CheckoutPage";
import * as api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";

// Mock API
jest.mock("../api/api");

const mockPlaceOrder = jest.fn(() =>
  Promise.resolve({ order_number: "ABC123" })
);

api.placeOrder.mockImplementation(mockPlaceOrder);
api.validateCoupon.mockResolvedValue({
  data: { code: "SUMMER10", discount: 10, type: "percent", min_order_value: 0 }
});

const cartItems = [
  {
    productId: 1,
    variantId: 101,
    name: "Sun Tee",
    color: "Blue",
    size: "M",
    quantity: 2,
    price: 25.0,
    variant: { id: 101, price: 25.0 },
  },
];

const renderWithContext = (user = { email: "test@sks.com", shipping_address: {
  full_name: "Danica Murphy",
  street: "123 Beach Rd",
  city: "Miami",
  state: "FL",
  zip_code: "33101"
} }) => {
  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user }}>
        <CartContext.Provider
          value={{
            cart: cartItems,
            updateQuantity: jest.fn(),
            removeFromCart: jest.fn(),
            clearCart: jest.fn(),
            getDiscountedPrice: (v) => v.price,
          }}
        >
          <CheckoutPage />
        </CartContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe("💳 CheckoutPage", () => {
  it("renders cart items and totals", () => {
    renderWithContext();

    expect(screen.getByText("Checkout")).toBeInTheDocument();
    expect(screen.getByText("Your Items")).toBeInTheDocument();
    expect(screen.getByText("Sun Tee")).toBeInTheDocument();
    expect(screen.getByText((_, node) => node.textContent === "Qty: 2")).toBeInTheDocument();
    expect(screen.getAllByText("$50.00").length).toBeGreaterThan(0);
  });

  it("applies a valid coupon and updates summary", async () => {
    renderWithContext();

    fireEvent.change(screen.getByPlaceholderText(/Enter coupon/i), {
      target: { value: "SUMMER10" },
    });

    fireEvent.click(screen.getByText("Apply"));

    await waitFor(() => {
      expect(screen.getByText(/✓ Coupon applied/i)).toBeInTheDocument();
    });

    const summary = screen.getByText("Summary").closest(".checkout-summary");

    expect(within(summary).getByText(/\$50\.00/)).toBeInTheDocument();
    expect(within(summary).getByText(/-?\$10\.00/)).toBeInTheDocument();
    expect(within(summary).getByText(/\$40\.00/)).toBeInTheDocument();
  });


  it("shows error on incomplete form during checkout", async () => {
    renderWithContext();

    fireEvent.click(screen.getByText("Place Order"));

    await waitFor(() => {
      const errorMessages = screen.getAllByText(/Please complete all required fields/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });
});
