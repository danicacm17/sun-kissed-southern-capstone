import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/ManageReturns.css";

function ManageReturns() {
  const [returns, setReturns] = useState([]);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/returns", {
        params: { status: statusFilter || undefined },
      });
      const initialized = (res.data || []).map((r) => ({
        ...r,
        restock: false,
      }));
      setReturns(initialized.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    } catch (err) {
      console.error("Error fetching returns", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, action, overrideStatus = null, restock = false) => {
    try {
      let url, payload;

      if (action === "reopen") {
        url = `/api/returns/${id}/reopen`;
        payload = null;
      } else if (action === "receive") {
        url = `/api/returns/${id}/receive`;
        payload = null;
      } else {
        url = `/api/admin/returns/${id}`;
        payload = { status: overrideStatus, restock };
      }

      const res = await api.patch(url, payload);
      setMessage(res.data.message || "Return updated.");
      fetchReturns();
    } catch (err) {
      console.error("Failed to update return", err);
      setMessage("Error processing return");
    }
  };

  const totalPages = Math.ceil(returns.length / perPage);
  const paginatedReturns = returns
    .filter((r) =>
      search === "" ||
      r.product_name.toLowerCase().includes(search.toLowerCase()) ||
      r.user_email.toLowerCase().includes(search.toLowerCase()) ||
      r.user_name.toLowerCase().includes(search.toLowerCase()) ||
      r.order_number.toString().includes(search)
    )
    .slice((page - 1) * perPage, page * perPage);

  return (
    <div className="manage-returns">
      <h2>Manage Returns</h2>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search by product, name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginRight: "1rem", padding: "8px", width: "60%" }}
        />
        <label htmlFor="status-filter">Filter by Status: </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All</option>
          <option value="Requested">Requested</option>
          <option value="Received">Received</option>
          <option value="Refunded">Refunded</option>
          <option value="Denied">Denied</option>
        </select>
      </div>

      {message && <p>{message}</p>}
      {loading ? (
        <p>Loading returns...</p>
      ) : paginatedReturns.length === 0 ? (
        <p>No return requests.</p>
      ) : (
        <ul>
          {paginatedReturns.map((r) => (
            <li key={r.id} style={{ marginBottom: "1rem" }}>
              <strong>Return #{r.id}</strong> — Status: <strong>{r.status}</strong>
              <br />
              Reason: {r.reason}
              <br />
              Returned Qty: {r.quantity}, Refund: ${parseFloat(r.refund_amount || 0).toFixed(2)}
              <br />
              Product: {r.product_name} — Variant: {r.variant_color}, {r.variant_size}
              <br />
              SKU: {r.variant_sku} (Product SKU: {r.product_sku})
              <p>
                <strong>User:</strong> {r.user_name} ({r.user_email})<br />
                <strong>Order:</strong> #{r.order_number}<br />
                <strong>Billing:</strong>{" "}
                {r.billing_address?.street}, {r.billing_address?.city},{" "}
                {r.billing_address?.state} {r.billing_address?.zip_code},{" "}
                {r.billing_address?.country}
              </p>

              {r.status === "Requested" && (
                <>
                  <button onClick={() => handleUpdate(r.id, "receive")}>Mark Received</button>{" "}
                  <button onClick={() => handleUpdate(r.id, "process", "Denied")}>Deny</button>
                </>
              )}

              {r.status === "Received" && (
                <>
                  <label>
                    <input
                      type="checkbox"
                      checked={r.restock}
                      onChange={(e) =>
                        setReturns((prev) =>
                          prev.map((ret) =>
                            ret.id === r.id ? { ...ret, restock: e.target.checked } : ret
                          )
                        )
                      }
                    />{" "}
                    Restock item
                  </label>
                  <br />
                  <button onClick={() => handleUpdate(r.id, "process", "Refunded", r.restock)}>
                    Process Refund
                  </button>{" "}
                  <button onClick={() => handleUpdate(r.id, "process", "Denied")}>Deny</button>
                </>
              )}

              {r.status === "Denied" && (
                <button onClick={() => handleUpdate(r.id, "reopen")}>Reopen Request</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div style={{ marginTop: "1rem" }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span style={{ margin: "0 10px" }}>
            Page {page} of {totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ManageReturns;
