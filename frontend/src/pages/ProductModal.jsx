import React, { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext";
import { useDiscountUtils } from "../components/discountUtils";
import "../styles/ProductModal.css";

function ProductModal({ product, onClose }) {
  const { addToCart } = useCart();
  const { getDiscountedPrice } = useDiscountUtils();

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [reviews, setReviews] = useState([]);
  const reviewsPerPage = 3;

  const imageRef = useRef(null);
  const activeVariants = product.variants?.filter((v) => v.is_active) || [];

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/products/${product.id}/reviews`);
        const data = await res.json();
        setReviews(data.items || []);
      } catch (err) {
        console.error("Error loading reviews", err);
      }
    };
    fetchReviews();
  }, [product.id]);

  useEffect(() => {
    if (activeVariants.length) {
      const first = activeVariants[0];
      setSelectedColor(first.color);
      setSelectedSize(first.size);
      setSelectedVariant(first);
      setMainImage(product.image_url || "/placeholder.jpg");
    }
  }, [product]);

  useEffect(() => {
    const matchingSizes = activeVariants
      .filter((v) => v.color === selectedColor)
      .map((v) => v.size);
    if (!matchingSizes.includes(selectedSize)) {
      setSelectedSize(matchingSizes[0]);
    }
  }, [selectedColor]);

  useEffect(() => {
    if (!selectedColor || !selectedSize) return;
    const variant = activeVariants.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    );
    setSelectedVariant(variant || null);
  }, [selectedColor, selectedSize, activeVariants]);

  const handleAddToCart = () => {
    if (!selectedVariant || typeof selectedVariant.id !== "number" || selectedVariant.quantity < 1) return;

    const discounted = getDiscountedPrice(selectedVariant);

    addToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      image: mainImage,
      price: discounted,
      originalPrice: selectedVariant.price,
      size: selectedVariant.size,
      color: selectedVariant.color,
      quantity,
    });

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleMouseMove = (e) => {
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = "scale(2)";
  };

  const resetZoom = () => {
    const img = imageRef.current;
    img.style.transformOrigin = "center center";
    img.style.transform = "scale(1)";
  };

  const colors = [...new Set(activeVariants.map((v) => v.color))];
  const sizes = [...new Set(activeVariants.filter((v) => v.color === selectedColor).map((v) => v.size))];

  const paginatedReviews = reviews.slice(
    (currentReviewPage - 1) * reviewsPerPage,
    currentReviewPage * reviewsPerPage
  );

  const hasMoreReviews = reviews.length > reviewsPerPage;
  const finalPrice = selectedVariant ? getDiscountedPrice(selectedVariant) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>

        <div className="modal-body">
          <div className="modal-left">
            <div
              className="image-zoom-container"
              onMouseMove={handleMouseMove}
              onMouseLeave={resetZoom}
            >
              <img
                ref={imageRef}
                src={mainImage || "/placeholder.jpg"}
                alt={product.name}
                className="main-product-modal-image"
              />
            </div>

            <div className="modal-thumbs">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt="Main Product"
                  className={`thumbnail ${mainImage === product.image_url ? "active" : ""}`}
                  onClick={() => setMainImage(product.image_url)}
                />
              )}
              {activeVariants.map((v, i) =>
                v.image_url ? (
                  <img
                    key={i}
                    src={v.image_url}
                    alt={`${v.color} ${v.size}`}
                    className={`thumbnail ${mainImage === v.image_url ? "active" : ""}`}
                    onClick={() => setMainImage(v.image_url)}
                  />
                ) : null
              )}
            </div>
          </div>

          <div className="modal-right">
            <h2>{product.name}</h2>

            <div className="price-section">
              {selectedVariant && finalPrice < selectedVariant.price ? (
                <>
                  <span className="price-discounted">${finalPrice.toFixed(2)}</span>
                  <span className="price-original">${selectedVariant.price.toFixed(2)}</span>
                </>
              ) : (
                <span className="price">${selectedVariant?.price?.toFixed(2) || "Unavailable"}</span>
              )}
            </div>

            <div className="selectors">
              <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
                {colors.map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>

              <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
                {sizes.map((size) => {
                  const variant = activeVariants.find(v => v.color === selectedColor && v.size === size);
                  return (
                    <option key={size} value={size} disabled={variant?.quantity === 0}>
                      {size}{variant?.quantity === 0 ? " (Out of Stock)" : ""}
                    </option>
                  );
                })}
              </select>

              <select value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <option key={i} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>

            <button
              className={`add-to-cart-btn ${selectedVariant?.quantity < 1 ? "disabled" : ""}`}
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.quantity < 1}
            >
              {selectedVariant?.quantity < 1 ? "Out of Stock" : "Add to Cart"}
            </button>

            {showToast && (
              <div className="toast">Item added to cart!</div>
            )}

            <p className="modal-description">{product.description}</p>

            <div className="reviews-section">
              <h4>Reviews</h4>
              {reviews.length ? (
                <>
                  {paginatedReviews.map((r, i) => (
                    <div key={i} className="review">
                      <strong>{r.user_first_name} {r.user_last_name?.charAt(0)}.</strong>{" "}
                      <span className="stars">
                        {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                      </span>
                      <p>{r.comment}</p>
                    </div>
                  ))}
                  {hasMoreReviews && (
                    <div className="review-nav">
                      <button
                        onClick={() => setCurrentReviewPage((p) => Math.max(p - 1, 1))}
                        disabled={currentReviewPage === 1}
                      >
                        Prev
                      </button>
                      <button
                        onClick={() =>
                          setCurrentReviewPage((p) =>
                            p * reviewsPerPage < reviews.length ? p + 1 : p
                          )
                        }
                        disabled={currentReviewPage * reviewsPerPage >= reviews.length}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="no-reviews">No reviews yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;
