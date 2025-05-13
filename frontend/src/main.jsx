import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { FavoriteProvider } from "./context/FavoriteContext";
import { SalesProvider } from "./context/SalesContext"; // ✅ NEW
import "./index.css";
import "./styles/global.css";

// Wrapper to show loading while auth is initializing
function AppWrapper() {
  const { loading } = useAuth();
  return loading ? <div className="loading-screen">Loading...</div> : <App />;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <SalesProvider>
        <FavoriteProvider>
          <CartProvider>
            <AppWrapper />
          </CartProvider>
        </FavoriteProvider>
      </SalesProvider>
    </AuthProvider>
  </React.StrictMode>
);
