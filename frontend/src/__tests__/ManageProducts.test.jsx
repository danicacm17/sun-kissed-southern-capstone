import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ManageProducts from "../pages/ManageProducts";
import api from "../api/api";

jest.mock("../api/api");

const mockProducts = [
  {
    id: 1,
    name: "T-Shirt",
    sku: "TSHIRT001",
    description: "Soft cotton tee",
    category: "T-Shirts",
    image_url: "https://example.com/tshirt.jpg",
    is_active: true,
  },
];

const mockVariants = {
  1: [
    {
      id: 10,
      sku: "TSHIRT001-BLUE-M",
      size: "M",
      color: "Blue",
      price: "19.99",
      quantity: 5,
      is_active: true,
      image_url: "",
    },
  ],
};

beforeEach(() => {
  api.get.mockImplementation((url) => {
    if (url === "/api/admin/products") {
      return Promise.resolve({ data: { items: mockProducts } });
    }
    if (url === "/api/admin/products/1/variants") {
      return Promise.resolve({ data: mockVariants[1] });
    }
    return Promise.resolve({ data: [] });
  });

  api.patch.mockResolvedValue({});
  api.post.mockResolvedValue({});
});

describe("ManageProducts", () => {
  it("renders product and variant info", async () => {
    render(<ManageProducts />);
    await screen.findByText("T-Shirt");

    // More specific matcher to avoid multiple matches
    expect(
        screen.getByText((_, el) => el.textContent === "T-Shirt (TSHIRT001)")
    ).toBeInTheDocument();

    expect(screen.getByText("Soft cotton tee")).toBeInTheDocument();
    expect(screen.getByText(/Blue/i)).toBeInTheDocument();
    expect(screen.getByText(/Qty: 5/)).toBeInTheDocument();
  });

  it("opens product modal and cancels", async () => {
    render(<ManageProducts />);
    fireEvent.click(screen.getByRole("button", { name: "Add Product" }));

    expect(
      await screen.findByRole("heading", { name: "Add Product" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Add Product" })
      ).not.toBeInTheDocument()
    );
  });

  it("opens variant modal and cancels", async () => {
    render(<ManageProducts />);
    await screen.findByText("T-Shirt");

    fireEvent.click(screen.getAllByText("Add Variant")[0]);

    expect(
      await screen.findByRole("heading", { name: "Add Variant" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Add Variant" })
      ).not.toBeInTheDocument()
    );
  });

  it("searches for product by SKU", async () => {
    render(<ManageProducts />);
    await screen.findByText("T-Shirt");

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "TSHIRT001" },
    });

    expect(screen.getByText("T-Shirt")).toBeInTheDocument();
  });

  it("toggles variant active state", async () => {
    render(<ManageProducts />);
    await screen.findByText(/Blue/i);

    // Narrow the button to the one inside variant buttons
    const variantDisableBtn = screen
        .getAllByText("Disable")
        .find((btn) => btn.closest(".variant-buttons"));
    fireEvent.click(variantDisableBtn);

    await waitFor(() =>
        expect(api.patch).toHaveBeenCalledWith(
        "/api/admin/products/1/variants/10/disable"
        )
    );
  });

  it("toggles product active state", async () => {
    render(<ManageProducts />);
    await screen.findByText("T-Shirt");

    // Find the product-level Disable button
    const productCard = screen.getByText((_, el) =>
        el.textContent === "T-Shirt (TSHIRT001)"
    ).closest(".product-card");

    const disableBtn = productCard.querySelector(".product-buttons-inline button:last-child");
    fireEvent.click(disableBtn);

    await waitFor(() =>
        expect(api.patch).toHaveBeenCalledWith("/api/admin/products/1/disable")
    );
  });
});
