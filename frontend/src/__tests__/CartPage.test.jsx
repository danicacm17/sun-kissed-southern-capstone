import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CartPage from "../pages/CartPage";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";


// Helper to render with context
function renderWithContext({ cartItems = [], user = null }) {
  const mockUpdateQuantity = jest.fn();
  const mockRemoveFromCart = jest.fn();
  const mockGetDiscountedPrice = (variant) => variant.price;

  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user }}>
        <CartContext.Provider
          value={{
            cart: cartItems,
            updateQuantity: mockUpdateQuantity,
            removeFromCart: mockRemoveFromCart,
            getDiscountedPrice: mockGetDiscountedPrice,
          }}
        >
          <CartPage />
        </CartContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("🛒 CartPage", () => {
  it("shows empty cart message", () => {
    renderWithContext({ cartItems: [] });
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start shopping/i })).toBeInTheDocument();
  });

  it("displays cart items", () => {
    const mockCart = [
      {
        productId: 1,
        variantId: 101,
        name: "Sun Tee",
        color: "Blue",
        size: "M",
        price: 20,
        originalPrice: 20,
        quantity: 2,
        image: "/suntee.jpg",
        variant: { price: 20 },
      },
    ];
    renderWithContext({ cartItems: mockCart });

    expect(screen.getByText("Sun Tee")).toBeInTheDocument();
    expect(screen.getByText("Blue / M")).toBeInTheDocument();
    expect(screen.getByText("$20.00 each")).toBeInTheDocument();
    expect(screen.getByText(/Total/i)).toBeInTheDocument();
  });

  it("shows login modal when unauthenticated user tries to checkout", async () => {
    const mockCart = [
      {
        productId: 1,
        variantId: 101,
        name: "Sun Tee",
        color: "Blue",
        size: "M",
        price: 20,
        originalPrice: 20,
        quantity: 1,
        image: "/suntee.jpg",
        variant: { price: 20 },
      },
    ];
    renderWithContext({ cartItems: mockCart, user: null });

    fireEvent.click(screen.getByText(/Proceed to Checkout/i));

    await waitFor(() => {
      expect(screen.getByText(/Login Required/i)).toBeInTheDocument();
    });
  });
});
