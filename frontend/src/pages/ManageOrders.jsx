import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/ManageOrders.css";

function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [returnModalItem, setReturnModalItem] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnQty, setReturnQty] = useState(1);
  const [trackingEdits, setTrackingEdits] = useState({});
  const [cancelModalItem, setCancelModalItem] = useState(null);
  const [restockCancel, setRestockCancel] = useState(false);
  const perPage = 5;

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/orders");
      const sorted = res.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setOrders(sorted);
    } catch (err) {
      console.error("Failed to fetch orders", err);
      setMessage("Error loading orders");
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) =>
    status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const toggleDetails = (id) => {
    setExpandedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirmCancel = async () => {
    if (!cancelModalItem) return;
    try {
      await api.patch(`/api/admin/orders/${cancelModalItem.order_item_id}/cancel`, {
        restock: restockCancel,
        cancel_quantity: cancelModalItem.cancelQty || 1
      });
      closeCancelModal();
      fetchOrders();
    } catch (err) {
      console.error("Failed to cancel item", err);
      setMessage("Error cancelling item");
    }
  };

  const handleReturnRequest = async () => {
    try {
      await api.post("/api/returns", {
        order_item_id: returnModalItem.order_item_id,
        reason: returnReason,
        quantity: returnQty,
      });
      closeModal();
      fetchOrders();
    } catch (err) {
      console.error("Failed to request return", err);
      setMessage("Error requesting return");
    }
  };

  const handleUpdateTracking = async (itemId, newTracking) => {
    try {
      await api.patch(`/api/admin/orders/${itemId}/tracking`, {
        tracking_number: newTracking,
      });
      setTrackingEdits((prev) => ({ ...prev, [itemId]: null }));
      fetchOrders();
    } catch (err) {
      console.error("Failed to update tracking", err);
      setMessage("Error updating tracking");
    }
  };

  const openReturnModal = (item) => {
    setReturnModalItem(item);
    setReturnQty(1);
    setReturnReason("");
  };

  const closeModal = () => {
    setReturnModalItem(null);
  };

  const openCancelModal = (item) => {
    setCancelModalItem({ ...item, cancelQty: 1 });
    setRestockCancel(false);
  };

  const closeCancelModal = () => {
    setCancelModalItem(null);
    setRestockCancel(false);
  };

  const filteredOrders = orders.filter((order) => {
    const query = search.toLowerCase();
    const fullName = `${order.user?.name || ""}`.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(query) ||
      order.user?.email.toLowerCase().includes(query) ||
      fullName.includes(query)
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / perPage);
  const paginatedOrders = filteredOrders.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="manage-orders">
      <h2>Manage Orders</h2>

      <input
        type="text"
        placeholder="Search by order #, customer name, or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "20px", padding: "8px", width: "100%" }}
      />

      {message && <p>{message}</p>}
      {loading ? (
        <p>Loading orders...</p>
      ) : paginatedOrders.length === 0 ? (
        <p>No matching orders found.</p>
      ) : (
        <ul>
          {paginatedOrders.map((order) => (
            <li key={order.id}>
              <h3>Order #{order.order_number}</h3>
              <p>
                <strong>Status:</strong> {formatStatus(order.status)} <br />
                <strong>Customer:</strong>{" "}
                {order.user
                  ? `${order.user.name} (${order.user.email})`
                  : "Guest"} <br />
                <strong>Total:</strong> ${parseFloat(order.total).toFixed(2)} <br />
                <strong>Date:</strong> {new Date(order.created_at).toLocaleString()}
              </p>

              <button onClick={() => toggleDetails(order.id)}>
                {expandedOrderIds.includes(order.id) ? "Hide Details" : "View Details"}
              </button>

              {expandedOrderIds.includes(order.id) && (
                <>
                  <h4>Items:</h4>
                  <ul>
                    {order.items.map((item) => (
                      <li key={item.order_item_id}>
                        <strong>{item.product_name} — {item.product_sku}</strong><br />
                        SKU: {item.variant.sku} — {item.variant.color}, {item.variant.size}<br />
                        Qty: {item.quantity}, Price: ${item.price}<br />
                        <strong>Status:</strong> {formatStatus(item.status)}<br />

                        {item.status !== "cancelled" && (
                          <>
                            <strong>Tracking:</strong>{" "}
                            {trackingEdits[item.order_item_id] != null ? (
                              <>
                                <input
                                  type="text"
                                  value={trackingEdits[item.order_item_id]}
                                  onChange={(e) =>
                                    setTrackingEdits((prev) => ({
                                      ...prev,
                                      [item.order_item_id]: e.target.value,
                                    }))
                                  }
                                />
                                <button onClick={() =>
                                  handleUpdateTracking(item.order_item_id, trackingEdits[item.order_item_id])
                                }>
                                  Save
                                </button>
                              </>
                            ) : (
                              <>
                                {item.tracking_number || "None"}{" "}
                                <button
                                  className="tracking-edit-btn"
                                  onClick={() =>
                                    setTrackingEdits((prev) => ({
                                      ...prev,
                                      [item.order_item_id]: item.tracking_number || "",
                                    }))
                                  }
                                >
                                  ✎
                                </button>
                              </>
                            )}
                            <br />
                          </>
                        )}

                        {item.return_status && (
                          <div style={{ fontStyle: "italic", color: "#666" }}>
                            Return status: {formatStatus(item.return_status)}
                          </div>
                        )}

                        {["paid", "fulfilled", "backordered"].includes(item.status) && (
                          <button onClick={() => openCancelModal(item)}>
                            Cancel Item
                          </button>
                        )}

                        {item.status === "shipped" && !item.return_status && (
                          <button onClick={() => openReturnModal(item)}>
                            Request Return
                          </button>
                        )}

                        {["cancelled", "returned", "refunded"].includes(item.status) && (
                          <em>No actions available</em>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div style={{ marginTop: "1rem" }}>
                    {order.shipping_address && (
                      <div>
                        <h4>Shipping Address</h4>
                        <p>
                          {order.shipping_address.full_name}, {order.shipping_address.street}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}
                        </p>
                      </div>
                    )}

                    {order.billing_address && (
                      <div>
                        <h4>Billing Address</h4>
                        <p>
                          {order.billing_address.full_name}, {order.billing_address.street}, {order.billing_address.city}, {order.billing_address.state} {order.billing_address.zip_code}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {returnModalItem && (
        <div className="return-modal">
          <h3>Request Return</h3>
          <p><strong>{returnModalItem.product_name}</strong></p>
          <label>
            Reason:<br />
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              style={{ width: "100%", marginBottom: "1rem" }}
            />
          </label>
          <label>
            Quantity:<br />
            <select
              value={returnQty}
              onChange={(e) => setReturnQty(parseInt(e.target.value))}
            >
              {Array.from({
                length:
                  returnModalItem.quantity -
                  (returnModalItem.cancelled_quantity || 0) -
                  (returnModalItem.returned_quantity || 0)
              }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <br /><br />
          <button onClick={handleReturnRequest}>Submit</button>{" "}
          <button onClick={closeModal}>Cancel</button>
        </div>
      )}

      {cancelModalItem && (
        <div className="return-modal">
          <h3>Cancel Item</h3>
          <p><strong>{cancelModalItem.product_name}</strong></p>
          <label>
            Quantity:<br />
            <select
              value={cancelModalItem.cancelQty || 1}
              onChange={(e) =>
                setCancelModalItem((prev) => ({
                  ...prev,
                  cancelQty: parseInt(e.target.value),
                }))
              }
            >
              {Array.from({
                length:
                  cancelModalItem.quantity -
                  (cancelModalItem.cancelled_quantity || 0) -
                  (cancelModalItem.returned_quantity || 0)
              }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={restockCancel}
              onChange={(e) => setRestockCancel(e.target.checked)}
            />
            {" "}Return quantity to stock
          </label>
          <br /><br />
          <button onClick={confirmCancel}>Confirm Cancel</button>{" "}
          <button onClick={closeCancelModal}>Close</button>
        </div>
      )}
    </div>
  );
}

export default ManageOrders;
