import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "../styles/ConfirmationPage.css";

function ConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  useEffect(() => {
    if (!order) {
      setTimeout(() => navigate("/"), 5000);
    }
  }, [order, navigate]);

  return (
    <div className="confirmation-page">
      {order ? (
        <>
          <h2>Thank You for Your Order!</h2>
          <p className="subtext">We’ve received your order and it’s being processed.</p>
          <p className="order-number">
            <span>Order #:</span> <strong>{order.order_number}</strong>
          </p>

          <div className="order-summary">
            <h4>Order Summary</h4>
            <div className="order-header">
              <span>Item</span>
              <span>Color / Size</span>
              <span>Qty</span>
              <span>Price</span>
            </div>
            {order.items?.map((item, idx) => (
              <div key={idx} className="order-row">
                <span>{item.name}</span>
                <span>{item.color} / {item.size}</span>
                <span>{item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="order-total">
              <span>Total:</span>
              <span>${order.total?.toFixed(2)}</span>
            </div>
            <button className="continue-btn" onClick={() => navigate("/")}>
              Continue Shopping
            </button>
          </div>
        </>
      ) : (
        <>
          <h2>Order Confirmed</h2>
          <p>If you refreshed, the order summary is no longer available.</p>
          <p>Redirecting you to the homepage...</p>
        </>
      )}
    </div>
  );
}

export default ConfirmationPage;
