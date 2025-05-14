import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProductModal from "../pages/ProductModal";
import { CartProvider } from "../context/CartContext";
import * as discountUtils from "../components/discountUtils";

// Mock fetch for product reviews
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      items: [
        { user_first_name: "Alice", user_last_name: "L", rating: 4, comment: "Great!" },
        { user_first_name: "Bob", user_last_name: "T", rating: 5, comment: "Excellent!" },
        { user_first_name: "Cara", user_last_name: "Z", rating: 3, comment: "Good enough." },
        { user_first_name: "Dave", user_last_name: "B", rating: 2, comment: "Not great." },
      ]
    }),
  })
);

// Mock getDiscountedPrice to return the same price
jest.spyOn(discountUtils, "useDiscountUtils").mockReturnValue({
  getDiscountedPrice: (v) => v.price
});

const mockProduct = {
  id: 1,
  name: "Test Product",
  description: "A cool product.",
  image_url: "/main.jpg",
  variants: [
    { id: 101, color: "Red", size: "S", price: 20.0, quantity: 3, is_active: true, image_url: "/red-s.jpg" },
    { id: 102, color: "Red", size: "M", price: 20.0, quantity: 0, is_active: true, image_url: "/red-m.jpg" },
    { id: 103, color: "Blue", size: "S", price: 25.0, quantity: 5, is_active: true, image_url: "/blue-s.jpg" }
  ]
};

function renderWithContext(product = mockProduct) {
  return render(
    <CartProvider>
      <ProductModal product={product} onClose={() => {}} />
    </CartProvider>
  );
}

describe("ProductModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders product name, description, and main image", async () => {
    renderWithContext();
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("A cool product.")).toBeInTheDocument();
    expect(screen.getByAltText("Test Product")).toBeInTheDocument();
    await screen.findByText("Great!"); // wait for reviews
  });

  test("displays correct price and handles variant selection", async () => {
    renderWithContext();
    await screen.findByText("Great!"); // reviews
    const price = screen.getByText("$20.00");
    expect(price).toBeInTheDocument();

    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "Blue" } });
    expect(screen.getByDisplayValue("Blue")).toBeInTheDocument();
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "S" } });
    expect(screen.getByDisplayValue("S")).toBeInTheDocument();

    expect(screen.getByText("$25.00")).toBeInTheDocument();
  });

  test("adds item to cart and shows toast", async () => {
    renderWithContext();
    await screen.findByText("Great!");

    const button = screen.getByRole("button", { name: "Add to Cart" });
    fireEvent.click(button);

    expect(await screen.findByText("Item added to cart!")).toBeInTheDocument();
  });

  test("disables Add to Cart button for out-of-stock variant", async () => {
    renderWithContext();
    await screen.findByText("Great!");
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "Red" } });
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "M" } }); // quantity 0
    const button = screen.getByRole("button", { name: "Out of Stock" });
    expect(button).toBeDisabled();
  });

  test("paginates reviews correctly", async () => {
    renderWithContext();
    expect(await screen.findByText("Great!")).toBeInTheDocument(); // first page
    expect(screen.getByText("Excellent!")).toBeInTheDocument();
    expect(screen.getByText("Good enough.")).toBeInTheDocument();
    expect(screen.queryByText("Not great.")).not.toBeInTheDocument();

    const nextBtn = screen.getByRole("button", { name: "Next" });
    fireEvent.click(nextBtn);
    expect(await screen.findByText("Not great.")).toBeInTheDocument();
  });
});
