import axios from "axios";

// Use live backend on Netlify, local backend during dev
const BASE_URL = import.meta.env.PROD
  ? "https://sun-kissed-southern-backend.onrender.com"
  : "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
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
