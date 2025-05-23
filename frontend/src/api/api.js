import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const validateCoupon = (code, cart, subtotal) =>
  api.post("/api/coupons/validate", {
    code,
    subtotal,
  });

export const fetchSales = () => api.get("/api/sales");

export async function placeOrder(payload) {
  const res = await api.post("/api/checkout", payload);
  return res.data;
}

export default api;
