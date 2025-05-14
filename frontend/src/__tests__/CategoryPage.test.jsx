// src/__tests__/CategoryPage.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CategoryPage from "../pages/CategoryPage";
import * as api from "../api/api";
import { useFavorites } from "../context/FavoriteContext";
import { useDiscountUtils } from "../components/discountUtils";

// Mock modules
jest.mock("../api/api");
jest.mock("../context/FavoriteContext", () => ({
  useFavorites: () => ({
    isFavorited: () => false,
    toggleFavorite: jest.fn(),
  }),
}));
jest.mock("../components/discountUtils", () => ({
  useDiscountUtils: () => ({
    getSaleForVariant: (id) => (id === 101 ? { discount_type: "percent", discount_value: 20, variant_ids: [101] } : null),
    getDiscountedPrice: (variant) =>
      variant.id === 101 ? +(variant.price * 0.8).toFixed(2) : variant.price,
  }),
}));

describe("🛍️ CategoryPage", () => {
  it("renders category title and product grid", async () => {
    api.default.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 1,
            name: "Sun Tee",
            image_url: "/sun-tee.jpg",
            variants: [
              { id: 101, price: 25.0, color: "Blue", size: "M", is_active: true },
              { id: 102, price: 30.0, color: "Red", size: "L", is_active: true },
            ],
          },
        ],
        total_pages: 1,
      },
    });

    render(
      <MemoryRouter initialEntries={["/category/t-shirts"]}>
        <Routes>
          <Route path="/category/:category" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("T-Shirts")).toBeInTheDocument();
    expect(await screen.findByText("Sun Tee")).toBeInTheDocument();
    expect(await screen.findByText(/From \$20.00 to \$30.00/i)).toBeInTheDocument();
  });

  it("shows message for empty category", async () => {
    api.default.get.mockResolvedValueOnce({
      data: { items: [], total_pages: 1 },
    });

    render(
      <MemoryRouter initialEntries={["/category/totes"]}>
        <Routes>
          <Route path="/category/:category" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/No products found/i)).toBeInTheDocument();
  });
});
