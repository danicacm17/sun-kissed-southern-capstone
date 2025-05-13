import { useState, useContext } from "react";
import ManageProducts from "./ManageProducts";
import ManageReturns from "./ManageReturns";
import ManageUsers from "./ManageUsers";
import ModerateReviews from "./ModerateReviews";
import AdminAnalytics from "./AdminAnalytics";
import FulfillmentView from "./FulfillmentView";
import InventoryManager from "./InventoryManager";
import ManageBlog from "./ManageBlog";
import ManageOrders from "./ManageOrders";
import ManageDiscounts from "./ManageDiscounts";
import { AuthContext } from "../context/AuthContext";
import "../styles/AdminDashboard.css";

function AdminDashboard() {
  const [view, setView] = useState("analytics");
  const { user } = useContext(AuthContext);

  if (!user || user.role !== "admin") {
    return <p>Access denied. Admins only.</p>;
  }

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <nav className="admin-nav">
        <button className={view === "analytics" ? "active" : ""} onClick={() => setView("analytics")}>Analytics</button>
        <button className={view === "users" ? "active" : ""} onClick={() => setView("users")}>Users</button>
        <button className={view === "reviews" ? "active" : ""} onClick={() => setView("reviews")}>Reviews</button>
        <button className={view === "orders" ? "active" : ""} onClick={() => setView("orders")}>Orders</button>
        <button className={view === "fulfillment" ? "active" : ""} onClick={() => setView("fulfillment")}>Fulfillment</button>
        <button className={view === "returns" ? "active" : ""} onClick={() => setView("returns")}>Returns</button>
        <button className={view === "products" ? "active" : ""} onClick={() => setView("products")}>Products</button>
        <button className={view === "inventory" ? "active" : ""} onClick={() => setView("inventory")}>Inventory</button>
        <button className={view === "discounts" ? "active" : ""} onClick={() => setView("discounts")}>Discounts</button>
        <button className={view === "blog" ? "active" : ""} onClick={() => setView("blog")}>Manage Blog</button>
      </nav>

      <div className="admin-content">
        {view === "analytics" && <AdminAnalytics />}
        {view === "products" && <ManageProducts />}
        {view === "returns" && <ManageReturns />}
        {view === "users" && <ManageUsers />}
        {view === "reviews" && <ModerateReviews />}
        {view === "fulfillment" && <FulfillmentView />}
        {view === "inventory" && <InventoryManager />}
        {view === "blog" && <ManageBlog />}
        {view === "orders" && <ManageOrders />}
        {view === "discounts" && <ManageDiscounts />}
      </div>
    </div>
  );
}

export default AdminDashboard;
