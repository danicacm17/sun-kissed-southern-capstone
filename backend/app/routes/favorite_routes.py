"""
Favorite Routes
Handles user favorites: add, remove, and list favorite products.
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.favorite import Favorite
from app.models.product import Product
from app.models.user import User
from app.utils.jwt_helpers import extract_user_info

favorite_bp = Blueprint("favorites", __name__)

# === Get all favorites for the current user ===
@favorite_bp.route("/api/favorites", methods=["GET"])
@jwt_required()
def get_favorites():
    """Return all favorite products for the current user."""
    user_id, _ = extract_user_info()
    user = User.query.get_or_404(user_id)

    return jsonify([
        {
            "id": fav.id,
            "product_id": fav.product_id,
            "product": fav.product.to_dict()
        }
        for fav in user.favorites
    ]), 200

# === Add a product to favorites ===
@favorite_bp.route("/api/favorites/<int:product_id>", methods=["POST"])
@jwt_required()
def add_favorite(product_id):
    """Add a product to the current user's favorites."""
    user_id, _ = extract_user_info()
    product = Product.query.get_or_404(product_id)

    existing = Favorite.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        return jsonify({"message": "Product already favorited"}), 200

    fav = Favorite(user_id=user_id, product_id=product_id)
    db.session.add(fav)
    db.session.commit()

    return jsonify({"message": "Product added to favorites"}), 201

# === Remove a product from favorites ===
@favorite_bp.route("/api/favorites/<int:product_id>", methods=["DELETE"])
@jwt_required()
def remove_favorite(product_id):
    """Remove a product from the current user's favorites."""
    user_id, _ = extract_user_info()
    favorite = Favorite.query.filter_by(user_id=user_id, product_id=product_id).first_or_404()

    db.session.delete(favorite)
    db.session.commit()

    return jsonify({"message": "Favorite removed"}), 200
