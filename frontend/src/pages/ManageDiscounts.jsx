import React from "react";
import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/ManageDiscounts.css";

const CATEGORY_OPTIONS = [
  "All",
  "T-Shirts",
  "Tank Tops",
  "Sweatshirts",
  "Beach Towels",
  "Tumblers",
  "Totes",
  "Accessories",
];

function ManageDiscounts() {
  const [coupons, setCoupons] = useState([]);
  const [sales, setSales] = useState([]);
  const [couponForm, setCouponForm] = useState({
    code: "",
    type: "fixed",
    amount: 0,
    min_order_value: 0,
    expires_at: "",
    max_uses: 1,
    is_active: true,
  });

  const [saleForm, setSaleForm] = useState({
    name: "",
    discount_type: "percent",
    discount_value: 0,
    start_date: "",
    end_date: "",
    category: "All",
    variant_skus: "",
  });

  useEffect(() => {
    fetchCoupons();
    fetchSales();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get("/api/admin/discounts/coupons");
      setCoupons(res.data);
    } catch (err) {
      console.error("Failed to load coupons", err);
    }
  };

  const fetchSales = async () => {
    const res = await api.get("/api/admin/discounts/sales");
    setSales(res.data);
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/admin/discounts/coupons", {
        ...couponForm,
        amount: parseFloat(couponForm.amount),
        min_order_value: parseFloat(couponForm.min_order_value),
        max_uses: parseInt(couponForm.max_uses),
      });
      setCouponForm({
        code: "",
        type: "fixed",
        amount: 0,
        min_order_value: 0,
        expires_at: "",
        max_uses: 1,
        is_active: true,
      });
      fetchCoupons();
    } catch (err) {
      if (err.response?.status === 400) {
        alert(err.response.data.error || "Coupon already exists.");
      } else {
        alert("Error creating coupon.");
      }
    }
  };

  const handleDeleteCoupon = async (id) => {
    await api.delete(`/api/admin/discounts/coupons/${id}`);
    fetchCoupons();
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    const skuArray = saleForm.variant_skus
      .split(",")
      .map((sku) => sku.trim())
      .filter(Boolean);
    try {
      await api.post("/api/admin/discounts/sales", {
        ...saleForm,
        discount_value: parseFloat(saleForm.discount_value),
        variant_skus: skuArray,
        category: saleForm.category === "All" ? "" : saleForm.category,
      });
      setSaleForm({
        name: "",
        discount_type: "percent",
        discount_value: 0,
        start_date: "",
        end_date: "",
        category: "All",
        variant_skus: "",
      });
      fetchSales();
    } catch (err) {
      if (err.response?.status === 400) {
        alert(err.response.data.error || "Sale name already exists.");
      } else {
        alert("Error creating sale.");
      }
    }
  };

  const handleDeleteSale = async (id) => {
    await api.delete(`/api/admin/discounts/sales/${id}`);
    fetchSales();
  };

  return (
    <div className="manage-discounts">
      <h2>Manage Discounts</h2>

      {/* Coupons Section */}
      <section className="coupon-section">
        <h3>Coupon Codes</h3>
        <form onSubmit={handleCreateCoupon} className="discount-form">
          <label>
            Code
            <input
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
              required
            />
          </label>
          <label>
            Type
            <select
              value={couponForm.type}
              onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
            >
              <option value="fixed">Fixed ($)</option>
              <option value="percent">Percent (%)</option>
            </select>
          </label>
          <label>
            Discount Amount
            <input
              type="number"
              value={couponForm.amount}
              onChange={(e) => setCouponForm({ ...couponForm, amount: e.target.value })}
            />
          </label>
          <label>
            Minimum Order Value
            <input
              type="number"
              value={couponForm.min_order_value}
              onChange={(e) => setCouponForm({ ...couponForm, min_order_value: e.target.value })}
            />
          </label>
          <label>
            Expiration Date
            <input
              type="datetime-local"
              value={couponForm.expires_at}
              onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
            />
          </label>
          <label>
            Max Uses
            <input
              type="number"
              value={couponForm.max_uses}
              onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })}
            />
          </label>
          <div className="form-button-wrapper">
            <button type="submit">Create Coupon</button>
          </div>
        </form>

        <ul className="discount-list">
          {coupons.map((c) => (
            <li key={c.id}>
              <strong className="discount-name">{c.code}</strong> — {c.type === "percent" ? `${c.amount}%` : `$${c.amount}`} — 
              Expires: {c.expires_at || "N/A"} — Used: {c.times_used} of {c.max_uses}
              <button onClick={() => handleDeleteCoupon(c.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      {/* Sales Section */}
      <section className="sales-section">
        <h3>Active Sales</h3>
        <form onSubmit={handleCreateSale} className="discount-form">
          <label>
            Sale Name
            <input
              value={saleForm.name}
              onChange={(e) => setSaleForm({ ...saleForm, name: e.target.value })}
              required
            />
          </label>
          <label>
            Discount Type
            <select
              value={saleForm.discount_type}
              onChange={(e) => setSaleForm({ ...saleForm, discount_type: e.target.value })}
            >
              <option value="percent">Percent (%)</option>
              <option value="amount">Fixed ($)</option>
            </select>
          </label>
          <label>
            Discount Value
            <input
              type="number"
              value={saleForm.discount_value}
              onChange={(e) => setSaleForm({ ...saleForm, discount_value: e.target.value })}
            />
          </label>
          <label>
            Start Date
            <input
              type="datetime-local"
              value={saleForm.start_date}
              onChange={(e) => setSaleForm({ ...saleForm, start_date: e.target.value })}
            />
          </label>
          <label>
            End Date
            <input
              type="datetime-local"
              value={saleForm.end_date}
              onChange={(e) => setSaleForm({ ...saleForm, end_date: e.target.value })}
            />
          </label>
          <label>
            Target Category
            <select
              value={saleForm.category}
              onChange={(e) => setSaleForm({ ...saleForm, category: e.target.value })}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
          <label>
            Variant SKUs (comma-separated)
            <input
              value={saleForm.variant_skus}
              onChange={(e) => setSaleForm({ ...saleForm, variant_skus: e.target.value })}
            />
          </label>
          <div className="form-button-wrapper">
            <button type="submit">Create Sale</button>
          </div>  
        </form>

        <ul className="discount-list">
          {sales.map((s) => (
            <li key={s.id}>
              <strong className="discount-name">{s.name}</strong> —{" "}
              {s.discount_type === "percent"
                ? `${s.discount_value}%`
                : `$${s.discount_value}`}
              {" — "}Category: {s.category || "None"}
              {" — "}Variants:{" "}
              {Array.isArray(s.variant_skus) && s.variant_skus.length > 0
                ? s.variant_skus.join(", ")
                : "All"}
              {" — "}Expires: {s.end_date ? new Date(s.end_date).toLocaleString() : "N/A"}
              <button onClick={() => handleDeleteSale(s.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ManageDiscounts;
