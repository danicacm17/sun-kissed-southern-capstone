import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";
import { useAuth } from "./AuthContext";

const FavoriteContext = createContext();

export function useFavorites() {
  return useContext(FavoriteContext);
}

export function FavoriteProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const res = await api.get("/api/favorites");
      const productList = res.data.map((f) => f.product); // full product list
      setFavorites(productList);
    } catch (err) {
      console.error("Failed to fetch favorites", err);
    }
  };

  const isFavorited = (productId) => {
    return favorites.some((product) => product.id === productId);
  };

  const toggleFavorite = async (productId) => {
    const currentlyFavorited = isFavorited(productId);

    try {
      if (currentlyFavorited) {
        await api.delete(`/api/favorites/${productId}`);
        setFavorites((prev) => prev.filter((p) => p.id !== productId));
      } else {
        await api.post(`/api/favorites/${productId}`);
        await fetchFavorites();
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  return (
    <FavoriteContext.Provider value={{ favorites, isFavorited, toggleFavorite }}>
      {children}
    </FavoriteContext.Provider>
  );
}
