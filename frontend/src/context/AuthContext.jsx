import { createContext, useState, useEffect, useContext } from "react";
import api from "../api/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/api/me");
        setUser(res.data);
      } catch (err) {
        console.error("Auth check failed", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Sync logout/login across browser tabs
    const handleStorage = () => {
      if (!localStorage.getItem("authToken")) {
        setUser(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/api/login", { email, password });
    localStorage.setItem("authToken", res.data.token);
    setUser(res.data.user);

    setTimeout(() => {
      window.location.href = "/"; // Triggers a fresh reload to home
    }, 50); // slight delay ensures token is saved before reload
  };

  const signup = async (formData) => {
    const res = await api.post("/api/register", formData);
    localStorage.setItem("authToken", res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    window.location.href = "/"; // Clean redirect to homepage
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, setUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
