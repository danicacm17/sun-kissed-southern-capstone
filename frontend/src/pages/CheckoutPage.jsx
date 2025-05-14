import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { validateCoupon, placeOrder } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "../styles/CheckoutPage.css";

function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart, getDiscountedPrice } = useCart();
  const { user } = useAuth();

  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    shipping: {
      full_name: "",
      street: "",
      city: "",
      state: "",
      zip_code: "",
    },
    billingSame: true,
    billing: {
      full_name: "",
      street: "",
      city: "",
      state: "",
      zip_code: "",
    },
    payment: {
      card_number: "",
      expiration_date: "",
      cvv: "",
    },
  });

  useEffect(() => {
    if (user?.shipping_address) {
      setForm((f) => ({
        ...f,
        shipping: { ...user.shipping_address },
        billing: f.billingSame ? { ...user.shipping_address } : f.billing,
      }));
    }
  }, [user]);

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + getDiscountedPrice(item.variant || { price: item.price }) * item.quantity,
    0
  );

  const discountValue = Number(coupon?.discount ?? 0);
  let discount = 0;
  if (!isNaN(discountValue)) {
    discount =
      coupon?.type?.toLowerCase() === "percent"
        ? parseFloat(((subtotal * discountValue) / 100).toFixed(2))
        : discountValue;
  }

  const total = (subtotal - discount > 0 ? subtotal - discount : 0).toFixed(2);

  const handleApplyCoupon = async () => {
    try {
      const result = await validateCoupon(couponCode, cart);
      const data = result.data; // ✅ Correct: extract actual coupon
      const minOrderValue = data.min_order_value || 0;

      if (subtotal < minOrderValue) {
        setCoupon(null);
        setError(`Coupon requires a minimum order of $${minOrderValue.toFixed(2)}`);
        return;
      }

      setCoupon(data);
      setError("");
    } catch (err) {
      setCoupon(null);
      setError("Invalid or expired coupon");
    }
  };

  const handleChange = (section, field, value) => {
    if (section === "billingSame") {
      setForm((f) => ({ ...f, billingSame: value }));
    } else {
      setForm((f) => ({
        ...f,
        [section]: {
          ...f[section],
          [field]: value,
        },
      }));
    }
  };

  const isFormValid = () => {
    const requiredFields = [
      ...Object.values(form.shipping),
      ...(!form.billingSame ? Object.values(form.billing) : []),
      form.payment.card_number,
      form.payment.expiration_date,
      form.payment.cvv,
    ];
    return requiredFields.every((field) => field.trim() !== "");
  };

  const handleCheckout = async () => {
    if (!isFormValid()) {
      setError("Please complete all required fields before placing your order.");
      return;
    }

    const payload = {
      cart: cart.map((item) => ({
        product_variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: getDiscountedPrice(item.variant || { price: item.price }),
      })),
      payment_info: form.payment,
      shipping_address: form.shipping,
      billing_same_as_shipping: form.billingSame,
      billing_address: form.billingSame ? null : form.billing,
      coupon_code: coupon?.code || "",
    };

    try {
      const res = await placeOrder(payload);
      setSuccess(`Order placed! Confirmation #: ${res.order_number}`);
      clearCart();

      navigate("/confirmation", {
        state: {
          order: {
            order_number: res.order_number,
            items: cart,
            total: parseFloat(total),
          },
        },
      });
    } catch (err) {
      console.error(err);
      setError("Checkout failed. Please check your details.");
    }
  };

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>

      {success && <p className="success-message">{success}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="checkout-cart-preview">
        <h4>Your Items</h4>
        {cart.map((item, idx) => {
          const price = getDiscountedPrice(item.variant || { price: item.price });
          return (
            <div key={idx} className="checkout-cart-item">
              <span>{item.name}</span>
              <span>{item.color} / {item.size}</span>
              <span>Qty: {item.quantity}</span>
              <span>${(price * item.quantity).toFixed(2)}</span>
            </div>
          );
        })}
        <p><a href="/cart">Edit Cart</a></p>
      </div>

      <div className="checkout-section">
        <h4>Shipping Address</h4>
        {["full_name", "street", "city", "state", "zip_code"].map((field) => (
          <input
            key={field}
            placeholder={field.replace("_", " ")}
            value={form.shipping[field]}
            onChange={(e) => handleChange("shipping", field, e.target.value)}
          />
        ))}
      </div>

      <div className="checkout-section">
        <label>
          <input
            type="checkbox"
            checked={form.billingSame}
            onChange={(e) => handleChange("billingSame", null, e.target.checked)}
          />{" "}
          Billing same as shipping
        </label>
      </div>

      {!form.billingSame && (
        <div className="checkout-section">
          <h4>Billing Address</h4>
          {["full_name", "street", "city", "state", "zip_code"].map((field) => (
            <input
              key={field}
              placeholder={field.replace("_", " ")}
              value={form.billing[field]}
              onChange={(e) => handleChange("billing", field, e.target.value)}
            />
          ))}
        </div>
      )}

      <div className="checkout-section">
        <h4>Payment</h4>
        <input
          placeholder="Card Number"
          value={form.payment.card_number}
          onChange={(e) => handleChange("payment", "card_number", e.target.value)}
        />
        <input
          placeholder="Expiration (MM/YY)"
          value={form.payment.expiration_date}
          onChange={(e) => handleChange("payment", "expiration_date", e.target.value)}
        />
        <input
          placeholder="CVV"
          value={form.payment.cvv}
          onChange={(e) => handleChange("payment", "cvv", e.target.value)}
        />
      </div>

      <div className="checkout-section">
        <h4>Coupon</h4>
        <input
          placeholder="Enter coupon"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
        />
        <button onClick={handleApplyCoupon}>Apply</button>
        {coupon && (
          <p className="coupon-message success">
            ✓ Coupon applied: {coupon.code} (
            {coupon.type?.toLowerCase() === "percent"
              ? `${coupon.discount}% off`
              : `$${Number(coupon.discount).toFixed(2)} off`}
            )
          </p>
        )}
        {!coupon && error && <p className="coupon-message error">{error}</p>}
      </div>

      <div className="checkout-summary">
        <h4>Summary</h4>
        <p>Subtotal: <strong>${subtotal.toFixed(2)}</strong></p>
        {coupon && <p>Discount: <strong>-${discount.toFixed(2)}</strong></p>}
        <p className="total">Total: <strong>${total}</strong></p>
      </div>

      {!success && <button onClick={handleCheckout}>Place Order</button>}
    </div>
  );
}

export default CheckoutPage;
