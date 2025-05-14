import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const SalesContext = createContext([]);

export function SalesProvider({ children }) {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    async function fetchSales() {
      console.log("Fetching sales..."); // ✅ Add this
      try {
        const res = await api.get("/api/sales");
        console.log("✅ Sales fetched:", res.data); // ✅ See what it returns
        setSales(res.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch sales:", err);
      }
    }

    fetchSales();
  }, []);

  return (
    <SalesContext.Provider value={sales}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  return useContext(SalesContext);
}
