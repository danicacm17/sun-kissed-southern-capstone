"""
Authentication routes for user registration, login, and authenticated user info.
"""

# === Imports ===
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from flask_jwt_extended import jwt_required
from app.utils.jwt_helpers import extract_user_info

auth_bp = Blueprint("auth", __name__)

# === Register a new user ===
@auth_bp.route("/api/register", methods=["POST"])
def register():
    """Register a new user account."""
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    first_name = data.get("first_name")
    last_name = data.get("last_name")

    if not email or not password or not first_name or not last_name:
        return jsonify({"error": "All fields are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    role = Role.query.filter_by(name="user").first()
    if not role:
        return jsonify({"error": "Default role not found"}), 500

    new_user = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        role_id=role.id
    )
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    token = new_user.generate_token()
    return jsonify({
        "token": token,
        "user": {
            "email": new_user.email,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "role": role.name
        }
    }), 201

# === Login an existing user ===
@auth_bp.route("/api/login", methods=["POST"])
def login():
    """Authenticate user and return access token."""
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        token = user.generate_token()
        return jsonify({
            "token": token,
            "user": {
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.name
            }
        }), 200

    return jsonify({"error": "Invalid credentials"}), 401

# === Get current user info ===
@auth_bp.route("/api/me", methods=["GET"])
@jwt_required()
def get_current_user_info():
    """Return info about the current authenticated user."""
    user_id, role = extract_user_info()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "user_id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": role
    }), 200

# === Update user profile ===
@auth_bp.route("/api/profile", methods=["PATCH"])
@jwt_required()
def update_profile():
    """Update current user's profile info. Requires current password."""
    identity = extract_user_info()
    if isinstance(identity, tuple):  # handle (id, role) tuple format
        user_id = identity[0]
    elif isinstance(identity, dict):  # handle {"id": ..., "role": ...} format
        user_id = identity.get("id")
    else:
        return jsonify({"error": "Invalid token identity format"}), 400

    user = User.query.get_or_404(user_id)
    data = request.get_json()

    current_password = data.get("current_password")
    if not current_password or not user.check_password(current_password):
        return jsonify({"error": "Invalid current password"}), 401

    if "first_name" in data:
        user.first_name = data["first_name"]
    if "last_name" in data:
        user.last_name = data["last_name"]

    if "email" in data:
        existing_user = User.query.filter_by(email=data["email"]).first()
        if existing_user and existing_user.id != user.id:
            return jsonify({"error": "Email already in use"}), 409
        user.email = data["email"]

    if "password" in data and data["password"]:
        user.set_password(data["password"])

    db.session.commit()
    return jsonify({
        "message": "Profile updated successfully",
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email
    }), 200

# === Get full profile with orders ===
@auth_bp.route("/api/profile/full", methods=["GET"])
@jwt_required()
def get_full_profile():
    """Return user info including full order history and related addresses/items."""
    user_id, _ = extract_user_info()
    user = User.query.get_or_404(user_id)

    orders = []
    for o in user.orders:
        orders.append({
            "id": o.id,
            "order_number": o.order_number,
            "status": o.status,
            "total": float(o.total),
            "created_at": o.created_at.isoformat(),
            "shipping_address": o.shipping_address.to_dict() if o.shipping_address else None,
            "billing_address": o.billing_address.to_dict() if o.billing_address else None,
            "items": [
                {
                    "product_id": item.product.id,
                    "product_name": item.product.name,
                    "product_sku": item.product.sku,
                    "variant": {
                        "sku": item.variant.sku,
                        "color": item.variant.color,
                        "size": item.variant.size
                    },
                    "quantity": item.quantity,
                    "price": float(item.price),
                    "status": item.status,
                    "tracking_number": item.tracking_number
                } for item in o.items
            ]
        })

    return jsonify({
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "orders": orders
    }), 200
