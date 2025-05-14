import React from "react";
import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/AdminAnalytics.css";

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [page, setPage] = useState({
    fulfillment: 1,
    revenue: 1,
    customers: 1,
    lowStock: 1,
    location: 1
  });
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/api/admin/analytics");
        setAnalytics(res.data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      }
    };
    fetchAnalytics();
  }, []);

  const paginate = (data, section) => {
    const start = (page[section] - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  };

  const changePage = (section, direction, totalLength) => {
    setPage((prev) => {
      const maxPage = Math.ceil(totalLength / itemsPerPage);
      const newPage = Math.min(Math.max(prev[section] + direction, 1), maxPage);
      return { ...prev, [section]: newPage };
    });
  };

  if (!analytics) return <p>Loading analytics...</p>;

  const summarizeFulfillment = (items) => {
    const summary = {};
    items.forEach((item) => {
      const key = item.order_number;
      if (!summary[key]) {
        summary[key] = {
          order_number: item.order_number,
          customer: item.recipient,
          total_quantity: item.quantity,
          total_price: item.price * item.quantity,
        };
      } else {
        summary[key].total_quantity += item.quantity;
        summary[key].total_price += item.price * item.quantity;
      }
    });
    return Object.values(summary);
  };

  const groupedLowStock = () => {
    const grouped = {};
    analytics.low_stock_alerts.forEach((v) => {
      const pid = v.product_id;
      if (!grouped[pid]) {
        grouped[pid] = {
          product_name: v.product_name,
          product_sku: v.product_sku,
          variants: [],
        };
      }
      grouped[pid].variants.push({
        sku: v.sku,
        color: v.color,
        size: v.size,
        quantity: v.quantity,
      });
    });
    return Object.values(grouped);
  };

  const summarizedFulfillment = summarizeFulfillment(analytics.fulfillment_summary);
  const lowStock = groupedLowStock();

  return (
    <div className="admin-analytics">
      <h2>Admin Analytics</h2>

      {/* Orders by Location */}
      <div className="analytics-section">
        <h3>Orders by Location</h3>
        <ul>
          {paginate(analytics.orders_by_location, "location").map((item, idx) => (
            <li key={idx}>{item.city}: {item.count}</li>
          ))}
        </ul>
        {analytics.orders_by_location.length > itemsPerPage && (
          <div className="pagination">
            <button onClick={() => changePage("location", -1, analytics.orders_by_location.length)}>Prev</button>
            <button onClick={() => changePage("location", 1, analytics.orders_by_location.length)}>Next</button>
          </div>
        )}
      </div>

      {/* Revenue by Day */}
      <div className="analytics-section">
        <h3>Revenue by Day (Last 30 Days)</h3>
        <ul>
          {paginate(analytics.revenue_by_day, "revenue").map((day, idx) => (
            <li key={idx}>{day.date}: ${parseFloat(day.revenue).toFixed(2)}</li>
          ))}
        </ul>
        {analytics.revenue_by_day.length > itemsPerPage && (
          <div className="pagination">
            <button onClick={() => changePage("revenue", -1, analytics.revenue_by_day.length)}>Prev</button>
            <button onClick={() => changePage("revenue", 1, analytics.revenue_by_day.length)}>Next</button>
          </div>
        )}
      </div>

      {/* Top Customers */}
      <div className="analytics-section">
        <h3>Top Customers</h3>
        <ul>
          {paginate(analytics.top_customers, "customers").map((c, idx) => (
            <li key={idx}>{c.first_name} {c.last_name} — ${parseFloat(c.total_spent).toFixed(2)}</li>
          ))}
        </ul>
      </div>

      {/* Low Stock Alerts */}
      <div className="analytics-section">
        <h3>Low Stock Alerts</h3>
        {paginate(lowStock, "lowStock").map((product, i) => (
          <div key={i} className="low-stock-group">
            <strong>{product.product_name} — {product.product_sku}</strong>
            <ul>
              {product.variants.map((v, j) => (
                <li key={`${product.product_sku}-${v.sku}`}>{v.sku} — {v.color}/{v.size} — Qty: {v.quantity}</li>
              ))}
            </ul>
          </div>
        ))}
        {lowStock.length > itemsPerPage && (
          <div className="pagination">
            <button onClick={() => changePage("lowStock", -1, lowStock.length)}>Prev</button>
            <button onClick={() => changePage("lowStock", 1, lowStock.length)}>Next</button>
          </div>
        )}
      </div>

      {/* Fulfillment Summary */}
      <div className="analytics-section">
        <h3>Fulfillment Summary</h3>
        {summarizedFulfillment.length === 0 ? (
          <p>All orders have been fulfilled.</p>
        ) : (
          <>
            <ul>
              {paginate(summarizedFulfillment, "fulfillment").map((item, idx) => (
                <li key={idx}>
                  Order #{item.order_number} — {item.customer} — {item.total_quantity} items — ${item.total_price.toFixed(2)}
                </li>
              ))}
            </ul>
            {summarizedFulfillment.length > itemsPerPage && (
              <div className="pagination">
                <button onClick={() => changePage("fulfillment", -1, summarizedFulfillment.length)}>Prev</button>
                <button onClick={() => changePage("fulfillment", 1, summarizedFulfillment.length)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminAnalytics;
