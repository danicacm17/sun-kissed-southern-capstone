import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ManageUsers from "../pages/ManageUsers";
import api from "../api/api";

jest.mock("../api/api");

const mockUsers = [
  {
    id: 1,
    first_name: "Alice",
    last_name: "Smith",
    email: "alice@example.com",
    role: "user",
  },
  {
    id: 2,
    first_name: "Bob",
    last_name: "Johnson",
    email: "bob@example.com",
    role: "admin",
  },
];

const mockUserDetail = {
  id: 1,
  first_name: "Alice",
  last_name: "Smith",
  email: "alice@example.com",
  role: "user",
  orders: [
    {
      order_number: "ORD123",
      status: "shipped",
      total: 50.0,
      created_at: "2025-05-01T12:00:00Z",
      shipping_address: {
        full_name: "Alice Smith",
        street: "123 Ocean Dr",
        city: "Tampa",
        state: "FL",
        zip_code: "33601",
      },
      billing_address: {
        full_name: "Alice Smith",
        street: "123 Ocean Dr",
        city: "Tampa",
        state: "FL",
        zip_code: "33601",
      },
    },
  ],
};

describe("ManageUsers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.startsWith("/api/admin/users?page=")) {
        return Promise.resolve({ data: { users: mockUsers, total_pages: 2 } });
      }
      if (url.startsWith("/api/admin/users/1")) {
        return Promise.resolve({ data: mockUserDetail });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test("renders list of users", async () => {
    render(<ManageUsers />);
    expect(screen.getByText(/Manage Users/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
      expect(screen.getByText(/Bob Johnson/)).toBeInTheDocument();
    });
  });

  test("filters users by search input", async () => {
    render(<ManageUsers />);
    await screen.findByText(/Alice Smith/);
    userEvent.clear(screen.getByPlaceholderText(/Search users/i));
    userEvent.type(screen.getByPlaceholderText(/Search users/i), "Bob");

    await waitFor(() => {
      expect(screen.queryByText(/Alice Smith/)).not.toBeInTheDocument();
      expect(screen.getByText(/Bob Johnson/)).toBeInTheDocument();
    });
  });

  test("loads user details when View Details is clicked", async () => {
    render(<ManageUsers />);
    await screen.findByText(/Alice Smith/);
    userEvent.click(screen.getAllByText("View Details")[0]);

    await waitFor(() => {
      expect(screen.getByText(/User Details/)).toBeInTheDocument();
      expect(screen.getByText(/ORD123/)).toBeInTheDocument();
      expect(screen.getAllByText(/Alice Smith, 123 Ocean Dr/)).toHaveLength(2);
    });
  });

  test("hides user details when toggled off", async () => {
    render(<ManageUsers />);
    await screen.findByText(/Alice Smith/);
    userEvent.click(screen.getAllByText("View Details")[0]);
    await waitFor(() => screen.getByText(/User Details/));
    userEvent.click(screen.getByText("Hide Details"));
    await waitFor(() => {
      expect(screen.queryByText(/User Details/)).not.toBeInTheDocument();
    });
  });

  test("shows no users found message when search has no results", async () => {
    render(<ManageUsers />);
    await screen.findByText(/Alice Smith/);
    userEvent.clear(screen.getByPlaceholderText(/Search users/i));
    userEvent.type(screen.getByPlaceholderText(/Search users/i), "Zachary");

    await waitFor(() => {
      expect(screen.getByText(/No users found/i)).toBeInTheDocument();
    });
  });

  test("pagination buttons are shown and functional", async () => {
    render(<ManageUsers />);
    await screen.findByText(/Alice Smith/);
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();

    userEvent.click(screen.getByText("Next →"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/admin/users?page=2");
    });
  });
});
