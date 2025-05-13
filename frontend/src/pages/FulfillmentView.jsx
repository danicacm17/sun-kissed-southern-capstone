import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/FulfillmentView.css";

function FulfillmentView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/fulfillment");
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch fulfillment orders", err);
      setMessage("Error loading fulfillment view");
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = (id) => {
    setExpandedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleFulfillItem = async (id) => {
    try {
      await api.patch(`/api/admin/orders/item/${id}/fulfill`);
      fetchOrders();
    } catch (err) {
      console.error("Failed to mark fulfilled", err);
      setMessage("Error fulfilling item");
    }
  };

  const handleBackorderItem = async (id) => {
    try {
      await api.patch(`/api/admin/orders/item/${id}/backorder`);
      fetchOrders();
    } catch (err) {
      console.error("Failed to backorder item", err);
      setMessage("Error marking item as backordered");
    }
  };

  const handleShipItem = async (id) => {
    try {
      const tracking = trackingInputs[id];
      if (!tracking) return alert("Tracking number required");
      await api.patch(`/api/admin/orders/item/${id}/ship`, {
        tracking_number: tracking,
      });
      fetchOrders();
    } catch (err) {
      console.error("Failed to ship item", err);
      setMessage("Error shipping item");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const q = search.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(q) ||
      order.user.name.toLowerCase().includes(q) ||
      order.user.email.toLowerCase().includes(q)
    );
  });

  const formatStatus = (status) => {
    if (!status) return "";
    return status
      .split("_")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="fulfillment-view">
      <h2>Warehouse Fulfillment View</h2>

      <input
        type="text"
        placeholder="Search by order #, name, or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "20px", padding: "8px", width: "100%" }}
      />

      {message && <p>{message}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : filteredOrders.length === 0 ? (
        <p>No orders to fulfill.</p>
      ) : (
        <ul>
          {filteredOrders.map((order) => (
            <li
              key={order.id}
              style={{
                marginBottom: "2rem",
                borderBottom: "1px solid #ccc",
                paddingBottom: "1rem",
              }}
            >
              <h3>Order: {order.order_number}</h3>
              <p>
                <strong>Status:</strong> {formatStatus(order.status)}<br />
                <strong>Ship to:</strong> {order.shipping_address.full_name}<br />
                {order.shipping_address.street}, {order.shipping_address.city},{" "}
                {order.shipping_address.state} {order.shipping_address.zip_code}
              </p>

              <button onClick={() => toggleDetails(order.id)}>
                {expandedOrderIds.includes(order.id) ? "Hide Details" : "View Details"}
              </button>

              {expandedOrderIds.includes(order.id) && (
                <>
                  <h4>Items:</h4>
                  <ul>
                    {order.items.map((item) => {
                      const cancelled = item.cancelled_quantity || 0;
                      const returned = item.returned_quantity || 0;
                      const fulfillableQty = item.quantity - cancelled - returned;

                      return (
                        <li key={item.order_item_id} style={{ marginBottom: "1rem" }}>
                          <strong>{item.product_name} — {item.product_sku}</strong><br />
                          Variant SKU: {item.variant.sku} | Color: {item.variant.color} | Size: {item.variant.size}<br />
                          Qty: {item.quantity}
                          {cancelled > 0 && <> (Cancelled: {cancelled})</>}
                          {returned > 0 && <> (Returned: {returned})</>}
                          <br />
                          Status: {formatStatus(item.status)}<br />

                          {["paid", "backordered"].includes(item.status) && fulfillableQty > 0 && (
                            <>
                              <button onClick={() => handleFulfillItem(item.order_item_id)}>
                                Mark as Fulfilled
                              </button>{" "}
                              {item.status !== "backordered" && (
                                <button onClick={() => handleBackorderItem(item.order_item_id)}>
                                  Mark as Backordered
                                </button>
                              )}
                            </>
                          )}

                          {item.status === "fulfilled" && (
                            <>
                              <input
                                type="text"
                                placeholder="Tracking Number"
                                value={trackingInputs[item.order_item_id] || ""}
                                onChange={(e) =>
                                  setTrackingInputs((prev) => ({
                                    ...prev,
                                    [item.order_item_id]: e.target.value,
                                  }))
                                }
                              />
                              <button onClick={() => handleShipItem(item.order_item_id)}>
                                Mark as Shipped
                              </button>
                            </>
                          )}

                          {item.status === "shipped" && (
                            <em>Tracking: {item.tracking_number}</em>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FulfillmentView;
