import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AdminDashboard from "../pages/AdminDashboard";
import { AuthContext } from "../context/AuthContext";

// Mock subcomponents
jest.mock("../pages/AdminAnalytics", () => () => <div>📊 Analytics</div>);
jest.mock("../pages/ManageUsers", () => () => <div>👥 Users</div>);
jest.mock("../pages/ModerateReviews", () => () => <div>📝 Reviews</div>);
jest.mock("../pages/ManageOrders", () => () => <div>📦 Orders</div>);
jest.mock("../pages/FulfillmentView", () => () => <div>🚚 Fulfillment</div>);
jest.mock("../pages/ManageReturns", () => () => <div>↩️ Returns</div>);
jest.mock("../pages/ManageProducts", () => () => <div>🛍️ Products</div>);
jest.mock("../pages/InventoryManager", () => () => <div>📦 Inventory</div>);
jest.mock("../pages/ManageBlog", () => () => <div>📰 Blog</div>);
jest.mock("../pages/ManageDiscounts", () => () => <div>💸 Discounts</div>);

describe("🧭 AdminDashboard", () => {
  it("denies access if user is not admin", () => {
    render(
      <AuthContext.Provider value={{ user: { role: "user" } }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );
    expect(screen.getByText(/Access denied/i)).toBeInTheDocument();
  });

  it("shows default analytics view for admin", () => {
    render(
      <AuthContext.Provider value={{ user: { role: "admin" } }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );
    expect(screen.getByText("📊 Analytics")).toBeInTheDocument();
  });

  it("switches to Users view when clicked", () => {
    render(
      <AuthContext.Provider value={{ user: { role: "admin" } }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );
    fireEvent.click(screen.getByText("Users"));
    expect(screen.getByText("👥 Users")).toBeInTheDocument();
  });

  it("switches to Blog view when clicked", () => {
    render(
      <AuthContext.Provider value={{ user: { role: "admin" } }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );
    fireEvent.click(screen.getByText("Manage Blog"));
    expect(screen.getByText("📰 Blog")).toBeInTheDocument();
  });
});
