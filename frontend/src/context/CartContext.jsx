import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });
  const [activeSales, setActiveSales] = useState([]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      fetchActiveSales();
    }
  }, []);

  const fetchActiveSales = async () => {
    try {
      const res = await api.get("/api/admin/discounts/sales");
      const now = new Date();
      const filtered = res.data.filter((s) => {
        const start = s.start_date ? new Date(s.start_date) : null;
        const end = s.end_date ? new Date(s.end_date) : null;
        return (!start || now >= start) && (!end || now <= end);
      });
      setActiveSales(filtered);
    } catch (err) {
      console.error("Failed to fetch sales", err);
    }
  };

  const getSaleForVariant = (variantId) => {
    for (const sale of activeSales) {
      if (sale.variant_ids.includes(variantId)) {
        return sale;
      }
    }
    return null;
  };

  const getDiscountedPrice = (variant) => {
    const sale = getSaleForVariant(variant.id);
    if (!sale) return variant.price;

    if (sale.discount_type === "percent") {
      return +(variant.price * (1 - sale.discount_value / 100)).toFixed(2);
    }
    if (sale.discount_type === "amount") {
      return Math.max(0, +(variant.price - sale.discount_value).toFixed(2));
    }
    return variant.price;
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId && i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (productId, variantId) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          item.productId !== productId || item.variantId !== variantId
      )
    );
  };

  const updateQuantity = (productId, variantId, quantity) => {
    if (quantity < 1) return removeFromCart(productId, variantId);
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getSaleForVariant,
        getDiscountedPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
