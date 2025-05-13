import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/ManageUsers.css";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const fetchUsers = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/users?page=${pageNum}`);
      setUsers(res.data.users);
      setTotalPages(res.data.total_pages);
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const res = await api.get(`/api/admin/users/${userId}`);
      setSelectedUser(res.data);
    } catch (err) {
      console.error("Error fetching user details", err);
    }
  };

  const nextPage = () => page < totalPages && setPage(page + 1);
  const prevPage = () => page > 1 && setPage(page - 1);

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(term) ||
      user.last_name.toLowerCase().includes(term) ||
      fullName.includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term)
    );
  });

  return (
    <div className="manage-users">
      <h2>Manage Users</h2>

      <input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setPage(1);
        }}
        style={{ padding: "0.5rem", marginBottom: "1rem", width: "100%" }}
      />

      {loading ? (
        <p>Loading users...</p>
      ) : filteredUsers.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul>
          {filteredUsers.map((user) => (
            <li key={user.id} style={{ marginBottom: "10px" }}>
              <strong>{user.first_name} {user.last_name}</strong> — {user.email} ({user.role})
              <button
                style={{ marginLeft: "10px" }}
                onClick={() =>
                  selectedUser?.id === user.id
                    ? setSelectedUser(null)  // hide details
                    : fetchUserDetails(user.id)  // show new details
                }
              >
                {selectedUser?.id === user.id ? "Hide Details" : "View Details"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls" style={{ marginTop: "1rem" }}>
          <button onClick={prevPage} disabled={page === 1}>
            ← Prev
          </button>
          <span style={{ margin: "0 10px" }}>
            Page {page} of {totalPages}
          </span>
          <button onClick={nextPage} disabled={page === totalPages}>
            Next →
          </button>
        </div>
      )}

      {/* Selected User Details */}
      {selectedUser && (
        <div className="user-details" style={{ marginTop: "2rem", borderTop: "1px solid #ccc", paddingTop: "1rem" }}>
          <h3>User Details</h3>
          <p><strong>Name:</strong> {selectedUser.first_name} {selectedUser.last_name}</p>
          <p><strong>Email:</strong> {selectedUser.email}</p>
          <p><strong>Role:</strong> {selectedUser.role}</p>

          <h4>Orders:</h4>
          {selectedUser.orders.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            <ul>
              {selectedUser.orders.map((order) => (
                <li key={order.order_number} style={{ marginBottom: "1rem" }}>
                  <strong>Order #{order.order_number}</strong> — {order.status} — ${order.total}
                  <br />
                  <small>Placed on: {new Date(order.created_at).toLocaleDateString()}</small>

                  {order.shipping_address && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <strong>Shipping Address:</strong><br />
                      {order.shipping_address.full_name}, {order.shipping_address.street}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}
                    </div>
                  )}
                  
                  {order.billing_address && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <strong>Billing Address:</strong><br />
                      {order.billing_address.full_name}, {order.billing_address.street}, {order.billing_address.city}, {order.billing_address.state} {order.billing_address.zip_code}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default ManageUsers;
