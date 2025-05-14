import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Profile from "../pages/Profile";
import { AuthProvider } from "../context/AuthContext";
import api from "../api/api";

jest.mock("../api/api");

const mockOrders = Array.from({ length: 6 }).map((_, i) => ({
  id: i + 1,
  order_number: `ORD00${i + 1}`,
  status: "shipped",
  total: 100 + i * 10,
  created_at: new Date("2025-05-01").toISOString(),
  shipping_address: {
    full_name: "Jane Doe",
    street: "123 Main St",
    city: "Tampa",
    state: "FL",
    zip_code: "33601",
  },
  billing_address: null,
  items: [
    {
      product_name: "Sun Tee",
      product_id: 1,
      quantity: 1,
      price: 29.99,
      status: "shipped",
      has_review: false,
      variant: {
        color: "Blue",
        size: "M",
        product_id: 1,
        product: { id: 1 },
      },
    },
  ],
}));

beforeEach(() => {
  api.get.mockResolvedValue({
    data: {
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      orders: mockOrders,
    },
  });

  api.patch.mockResolvedValue({ data: { message: "Profile updated." } });
  api.post.mockResolvedValue({ data: { message: "Review submitted." } });
});

function renderWithAuth() {
  render(
    <AuthProvider>
      <Profile />
    </AuthProvider>
  );
}

test("renders profile fields and orders", async () => {
  renderWithAuth();
  expect(await screen.findByDisplayValue("Jane")).toBeInTheDocument();
  expect(screen.getByText(/Order #ORD001/)).toBeInTheDocument();
});

test("validates profile before saving", async () => {
  renderWithAuth();
  await screen.findByDisplayValue("Jane");

  const firstNameInput = screen.getByLabelText(/First Name/i);
  userEvent.clear(firstNameInput);
  userEvent.click(screen.getByText(/Save Changes/i));

  expect(await screen.findByText(/All fields are required/i)).toBeInTheDocument();
});

test("shows and toggles order details", async () => {
  renderWithAuth();
  await screen.findByText(/Order #ORD001/);

  userEvent.click(screen.getAllByText(/View Details/i)[0]);
  expect(await screen.findByText(/Shipping:/)).toBeInTheDocument();

  userEvent.click(screen.getByText(/Hide Details/i));
  await waitFor(() => {
    expect(screen.queryByText(/Shipping:/)).not.toBeInTheDocument();
  });
});

test("opens and submits review modal", async () => {
  renderWithAuth();
  await screen.findByText(/Order #ORD001/);

  userEvent.click(screen.getAllByText(/View Details/i)[0]);
  const reviewLink = await screen.findByText("Leave a Review");
  userEvent.click(reviewLink);

  const modal = await screen.findByTestId("review-modal");
  expect(modal).toBeInTheDocument();

  userEvent.selectOptions(screen.getByLabelText(/Rating/), "4");
  userEvent.type(screen.getByLabelText(/Comment/), "Great product!");
  userEvent.click(screen.getByText(/Submit Review/));

  await waitFor(() => {
    expect(screen.queryByTestId("review-modal")).not.toBeInTheDocument();
  });
});

test("paginates orders", async () => {
  renderWithAuth();
  await screen.findByText(/Order #ORD001/);
  expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();

  userEvent.click(screen.getByText("Next"));
  await screen.findByText(/Order #ORD005/);
});
