import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CartPage.css";

function LoginModal({ onClose }) {
  const navigate = useNavigate();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Please Login or Sign Up to Checkout</h3>
        <button onClick={() => navigate("/login")}>Login</button>
        <button onClick={() => navigate("/signup")}>Sign Up</button>
        <button className="close-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default LoginModal;
