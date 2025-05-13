import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/api";
import ProductModal from "./ProductModal";
import { useDiscountUtils } from "../components/discountUtils";
import { useFavorites } from "../context/FavoriteContext";
import { useCart } from "../context/CartContext";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import "../styles/CategoryPage.css";

const categoryMap = {
  "t-shirts": "T-Shirts",
  "tank-tops": "Tank Tops",
  "sweatshirts": "Sweatshirts",
  "beach-towels": "Beach Towels",
  "tumblers": "Tumblers",
  "totes": "Totes",
  "accessories": "Accessories",
};

function CategoryPage() {
  const { category } = useParams();
  const normalizedCategory = categoryMap[category] || category;

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [animateId, setAnimateId] = useState(null);

  const { isFavorited, toggleFavorite } = useFavorites();
  const { getSaleForVariant, getDiscountedPrice } = useDiscountUtils();

  useEffect(() => {
    setPage(1);
  }, [normalizedCategory]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await api.get(
          `/api/products?category=${encodeURIComponent(normalizedCategory)}&page=${page}&limit=12`
        );
        setProducts(res.data.items || []);
        setTotalPages(res.data.total_pages || 1);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      }
    }
    fetchProducts();
  }, [normalizedCategory, page]);

  const handleFavoriteClick = (e, productId) => {
    e.stopPropagation();
    setAnimateId(productId);
    toggleFavorite(productId);
    setTimeout(() => setAnimateId(null), 300);
  };

  const renderPriceRange = (variants) => {
    if (!variants || variants.length === 0) return null;

    const debugPrices = variants.map((variant) => {
      const original = variant.price;
      const discounted = getDiscountedPrice(variant);
      console.log(`Variant ID: ${variant.id} | Original: ${original} | Discounted: ${discounted}`);
      return discounted;
    });

    const min = Math.min(...debugPrices);
    const max = Math.max(...debugPrices);

    return (
      <p className="price-range">
        From ${min.toFixed(2)} to ${max.toFixed(2)}
      </p>
    );
  };

  const isProductOnSale = (variants) => {
    return variants?.some((v) => {
      const sale = getSaleForVariant(v.id);
      return sale !== null;
    });
  };

  return (
    <div className="category-page">
      <h2>{normalizedCategory}</h2>

      {products.length === 0 ? (
        <p className="no-products">No products found in this category.</p>
      ) : (
        <>
          <div className="products-grid">
            {products.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="image-wrapper">
                  <img
                    src={product.image_url || "/placeholder.jpg"}
                    alt={product.name}
                  />
                  {isProductOnSale(product.variants) && (
                    <span className="sale-badge">Sale</span>
                  )}
                </div>

                <div className="card-header">
                  <h4>{product.name}</h4>
                  <button
                    className={`heart-btn ${
                      animateId === product.id ? "animate-heart" : ""
                    }`}
                    onClick={(e) => handleFavoriteClick(e, product.id)}
                  >
                    {isFavorited(product.id) ? (
                      <FaHeart style={{ color: "#e63946" }} />
                    ) : (
                      <FaRegHeart style={{ color: "#aaa" }} />
                    )}
                  </button>
                </div>

                {renderPriceRange(product.variants)}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                ← Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

export default CategoryPage;
