# cart_routes.py
#
# === ⚠️ CART FUNCTIONALITY TEMPORARILY DISABLED ===
#
# This file contains logic for storing carts server-side.
# However, for the current version of the site, all cart functionality
# is handled entirely on the frontend using localStorage.
#
# Server-side carts may be reintroduced in the future to support:
# - Persistent carts across devices
# - Analytics and cart recovery
# - Multi-session user experiences
#
# For now, this file is inactive and not required for site functionality.



# from flask import Blueprint, request, jsonify
# from app.extensions import db
# from app.models.cart import Cart, CartItem
# from app.models.product_variant import ProductVariant
# from app.models.user import User
# from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
# from app.utils.jwt_helpers import extract_user_info

# cart_bp = Blueprint("cart", __name__)

# # === Safe JWT check for optional login ===
# def safe_verify_jwt_optional():
#     try:
#         verify_jwt_in_request()
#     except Exception:
#         pass

# # === Get current user's cart OR return empty (for guest) ===
# @cart_bp.route("/api/cart", methods=["GET"])
# def get_cart():
#     safe_verify_jwt_optional()
#     identity = get_jwt_identity()
#     if not identity:
#         return jsonify([]), 200

#     user_id, _ = extract_user_info()
#     user = User.query.get(user_id)
#     if not user or not user.cart:
#         return jsonify([]), 200

#     return jsonify([item.to_dict() for item in user.cart.items]), 200

# # === Add item to cart (no login required) ===
# @cart_bp.route("/api/cart", methods=["POST"])
# def add_to_cart():
#     safe_verify_jwt_optional()
#     identity = get_jwt_identity()
#     if not identity:
#         return jsonify({"message": "Guest cart, handle on frontend"}), 200

#     user_id, _ = extract_user_info()
#     user = User.query.get(user_id)

#     if not user.cart:
#         user.cart = Cart(user_id=user.id)
#         db.session.add(user.cart)
#         db.session.flush()

#     data = request.get_json()
#     variant = ProductVariant.query.get_or_404(data["product_variant_id"])

#     item = CartItem.query.filter_by(cart_id=user.cart.id, product_variant_id=variant.id).first()
#     if item:
#         item.quantity += data["quantity"]
#     else:
#         item = CartItem(cart_id=user.cart.id, product_variant_id=variant.id, quantity=data["quantity"])
#         db.session.add(item)

#     db.session.commit()
#     return jsonify({"message": "Item added to cart"}), 201

# # === Update item in cart (no login required) ===
# @cart_bp.route("/api/cart/<int:item_id>", methods=["PATCH"])
# def update_cart_item(item_id):
#     safe_verify_jwt_optional()
#     identity = get_jwt_identity()
#     if not identity:
#         return jsonify({"error": "Login required to update cart"}), 401

#     user_id, _ = extract_user_info()
#     user = User.query.get_or_404(user_id)

#     item = CartItem.query.get_or_404(item_id)
#     if item.cart.user_id != user.id:
#         return jsonify({"error": "Unauthorized"}), 403

#     item.quantity = request.get_json().get("quantity", item.quantity)
#     db.session.commit()
#     return jsonify({"message": "Cart item updated"}), 200

# # === Delete item from cart (no login required) ===
# @cart_bp.route("/api/cart/<int:item_id>", methods=["DELETE"])
# def delete_cart_item(item_id):
#     safe_verify_jwt_optional()
#     identity = get_jwt_identity()
#     if not identity:
#         return jsonify({"error": "Login required to delete cart item"}), 401

#     user_id, _ = extract_user_info()
#     user = User.query.get_or_404(user_id)

#     item = CartItem.query.get_or_404(item_id)
#     if item.cart.user_id != user.id:
#         return jsonify({"error": "Unauthorized"}), 403

#     db.session.delete(item)
#     db.session.commit()
#     return jsonify({"message": "Item removed from cart"}), 200
