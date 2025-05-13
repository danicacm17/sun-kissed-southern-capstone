import { useFavorites } from "../context/FavoriteContext";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import "../styles/CategoryPage.css"; // reuse grid/card styles

function FavoritesPage() {
  const { favorites, isFavorited, toggleFavorite } = useFavorites();

  return (
    <div className="category-page">
      <h2>Your Favorites</h2>

      {favorites.length === 0 ? (
        <p className="no-products">You haven't favorited any products yet.</p>
      ) : (
        <div className="products-grid">
          {favorites.map((product) => {
            const categorySlug = product.category.toLowerCase().replace(/\s+/g, "-");

            return (
              <Link
                key={product.id}
                to={`/category/${categorySlug}`}
                className="product-card"
              >
                <img
                  src={product.image_url || "/placeholder.jpg"}
                  alt={product.name}
                />
                <div className="card-header">
                  <h4>{product.name}</h4>
                  <button
                    className="heart-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                  >
                    {isFavorited(product.id) ? (
                      <FaHeart style={{ color: "#e63946" }} />
                    ) : (
                      <FaRegHeart style={{ color: "#aaa" }} />
                    )}
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;
