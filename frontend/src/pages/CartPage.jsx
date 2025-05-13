import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import "../styles/CartPage.css";

function CartPage() {
  const { cart, updateQuantity, removeFromCart, getDiscountedPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const total = cart.reduce((sum, item) => {
    const price = getDiscountedPrice(item.variant || { price: item.price });
    return sum + price * item.quantity;
  }, 0);

  const handleCheckout = () => {
    if (!user) {
      setShowLoginPrompt(true);
    } else {
      navigate("/checkout");
    }
  };

  return (
    <div className="cart-page">
      <h2>Your Shopping Cart</h2>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty.</p>
          <img src="/empty-cart.png" alt="Empty cart" className="empty-cart-img" />
          <button onClick={() => navigate("/")}>Start Shopping</button>
        </div>
      ) : (
        <>
          <ul className="cart-items">
            {cart.map((item, index) => {
              const discountedPrice = getDiscountedPrice(item.variant || { price: item.price });
              const originalPrice = item.originalPrice || item.price;

              return (
                <li className="cart-item" key={`${item.productId}-${item.variantId}-${index}`}>
                  <img src={item.image || "/placeholder.jpg"} alt={item.name} />
                  <div className="item-details">
                    <strong>{item.name}</strong>
                    <p>{item.color} / {item.size}</p>
                    <p>
                      {discountedPrice < originalPrice ? (
                        <>
                          <span className="price-discounted">${discountedPrice.toFixed(2)}</span>{" "}
                          <span className="price-original">${originalPrice.toFixed(2)}</span>
                        </>
                      ) : (
                        <>${originalPrice.toFixed(2)} each</>
                      )}
                    </p>

                    <div className="cart-controls">
                      <label>
                        Qty:
                        <select
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.productId, item.variantId, parseInt(e.target.value))
                          }
                        >
                          {Array.from({ length: 10 }).map((_, i) => (
                            <option key={i} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="cart-summary">
            <p><strong>Total:</strong> ${total.toFixed(2)}</p>
            <button className="checkout-btn" onClick={handleCheckout}>Proceed to Checkout</button>
          </div>
        </>
      )}

      {showLoginPrompt && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Login Required</h3>
            <p>You need to be logged in to proceed to checkout.</p>
            <button onClick={() => navigate("/login")}>Login</button>
            <button onClick={() => navigate("/signup")}>Sign Up</button>
            <button className="close-btn" onClick={() => setShowLoginPrompt(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
