import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
});

// ✅ Add Authorization header automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const validateCoupon = (code, cart) =>
  api.post("/api/coupons/validate", {
    code,
    cart: cart.map((item) => ({
      product_variant_id: item.variantId,
      quantity: item.quantity,
    })),
  });

export const fetchSales = () => api.get("/api/sales");

export async function placeOrder(payload) {
  const res = await api.post("/api/checkout", payload);
  return res.data;
}

export default api;
