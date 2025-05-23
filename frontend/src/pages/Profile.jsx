import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import "../styles/Profile.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    current_password: "",
  });

  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [visibleFields, setVisibleFields] = useState({ current: false, new: false, confirm: false });
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 4;
  const [reviewModalItem, setReviewModalItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    fetchProfileAndOrders();
  }, []);

  const fetchProfileAndOrders = async () => {
    try {
      const res = await api.get("/api/profile/full");
      setOrders(res.data.orders);
      setProfile((prev) => ({
        ...prev,
        first_name: res.data.first_name,
        last_name: res.data.last_name,
        email: res.data.email,
      }));
    } catch (err) {
      console.error("Error loading profile", err);
      setError("Failed to load profile data.");
    }
  };

  const handleProfileChange = (field, value) => setProfile((p) => ({ ...p, [field]: value }));
  const handlePasswordChange = (field, value) => setPasswords((p) => ({ ...p, [field]: value }));
  const toggleExpand = (id) => setExpandedOrder(expandedOrder === id ? null : id);
  const toggleVisibility = (field) => setVisibleFields((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleProfileSave = async () => {
    setMessage("");
    setError("");

    if (!profile.first_name || !profile.last_name || !profile.email || !profile.current_password) {
      setError("All fields are required to update profile.");
      return;
    }

    if (passwords.new) {
      const isValidPassword =
        passwords.new.length >= 7 &&
        /[A-Z]/.test(passwords.new) &&
        /\d/.test(passwords.new);

      if (!isValidPassword) {
        setError("New password must be at least 7 characters and include one uppercase letter and one number.");
        return;
      }

      if (passwords.new !== passwords.confirm) {
        setError("New passwords do not match.");
        return;
      }
    }

    try {
      const res = await api.patch("/api/profile", {
        ...profile,
        password: passwords.new || undefined,
      });
      setMessage(res.data.message);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to update profile.");
    }
  };

  const openReviewModal = (item) => {
    const productId = item.product_id || item.variant?.product_id || item.variant?.product?.id;
    if (!productId) {
      console.error("Unable to determine product_id from item:", item);
      setError("Unable to leave a review — product not found.");
      return;
    }
    setReviewModalItem({ ...item, product_id: productId });
    setReviewRating(5);
    setReviewText("");
  };

  const closeReviewModal = () => setReviewModalItem(null);

  const submitReview = async () => {
    try {
      await api.post("/api/reviews", {
        product_id: reviewModalItem.product_id,
        rating: reviewRating,
        comment: reviewText,
      });
      setMessage("Review submitted for approval.");
      closeReviewModal();
      fetchProfileAndOrders();
    } catch (err) {
      console.error("Error submitting review", err);
      setError(err.response?.data?.error || "Failed to submit review.");
    }
  };

  const paginatedOrders = orders.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(orders.length / perPage);

  function formatStatus(status) {
    return status
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return (
    <div className="profile-page">
      <h2>My Profile</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="profile-section">
        <h3>Personal Info</h3>
        <label htmlFor="first-name">First Name</label>
        <input id="first-name" type="text" value={profile.first_name} onChange={(e) => handleProfileChange("first_name", e.target.value)} />
        <label htmlFor="last-name">Last Name</label>
        <input id="last-name" type="text" value={profile.last_name} onChange={(e) => handleProfileChange("last_name", e.target.value)} />
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={profile.email} onChange={(e) => handleProfileChange("email", e.target.value)} />
        <label htmlFor="current-password">Current Password (required to save)</label>
        <div className="password-field">
          <input
            id="current-password"
            type={visibleFields.current ? "text" : "password"}
            value={profile.current_password}
            onChange={(e) => handleProfileChange("current_password", e.target.value)}
          />
          <FontAwesomeIcon icon={visibleFields.current ? faEyeSlash : faEye} className="eye-icon" onClick={() => toggleVisibility("current")} />
        </div>
      </div>

      <div className="profile-section">
        <h3>Change Password</h3>
        <label htmlFor="new-password">New Password</label>
        <div className="password-field">
          <input
            id="new-password"
            type={visibleFields.new ? "text" : "password"}
            value={passwords.new}
            onChange={(e) => handlePasswordChange("new", e.target.value)}
          />
          <FontAwesomeIcon icon={visibleFields.new ? faEyeSlash : faEye} className="eye-icon" onClick={() => toggleVisibility("new")} />
        </div>
        <label htmlFor="confirm-password">Confirm New Password</label>
        <div className="password-field">
          <input
            id="confirm-password"
            type={visibleFields.confirm ? "text" : "password"}
            value={passwords.confirm}
            onChange={(e) => handlePasswordChange("confirm", e.target.value)}
          />
          <FontAwesomeIcon icon={visibleFields.confirm ? faEyeSlash : faEye} className="eye-icon" onClick={() => toggleVisibility("confirm")} />
        </div>
      </div>

      <button onClick={handleProfileSave}>Save Changes</button>

      <div className="profile-section">
        <h3>Your Orders</h3>
        {paginatedOrders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          paginatedOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-summary" onClick={() => toggleExpand(order.id)}>
                <strong>Order #{order.order_number}</strong> — {formatStatus(order.status)} — ${order.total}
                <br />
                <small>Placed on: {new Date(order.created_at).toLocaleDateString()}</small>
                <br />
                <span className="toggle-details">{expandedOrder === order.id ? "Hide Details" : "View Details"}</span>
              </div>

              {expandedOrder === order.id && (
                <div className="order-details">
                  <p>
                    <strong>Shipping:</strong> {order.shipping_address?.full_name}, {order.shipping_address?.street}, {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zip_code}
                  </p>
                  <p>
                    <strong>Billing:</strong> {order.billing_address?.full_name ? `${order.billing_address.full_name}, ${order.billing_address.street}, ${order.billing_address.city}, ${order.billing_address.state} ${order.billing_address.zip_code}` : "Same as shipping"}
                  </p>

                  <h4>Items:</h4>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item">
                      {item.product_name} ({item.variant.color}/{item.variant.size}) — Qty: {item.quantity} — ${item.price}
                      {item.status === "shipped" && !item.has_review && (
                        <span className="leave-review-link" onClick={() => openReviewModal(item)}>
                          Leave a Review
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {totalPages > 1 && (
          <div className="pagination" style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
            <span style={{ margin: "0 1rem" }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        )}
      </div>

      {reviewModalItem && (
        <div className="review-modal" data-testid="review-modal">
          <h4>Leave a Review for {reviewModalItem.product_name}</h4>
          <label htmlFor="review-rating">Rating (1–5):</label>
          <select
            id="review-rating"
            value={reviewRating}
            onChange={(e) => setReviewRating(parseInt(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <br />
          <label htmlFor="review-comment">Comment:</label>
          <textarea
            id="review-comment"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
          <br />
          <button onClick={submitReview}>Submit Review</button>
          <button onClick={closeReviewModal} style={{ background: "#999" }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default Profile;
