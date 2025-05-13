# === Imports ===
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.product_variant import ProductVariant
from app.utils.auth import role_required

variant_bp = Blueprint("variants", __name__)

# === Public: List Active Variants Only ===
@variant_bp.route("/api/products/<int:product_id>/variants", methods=["GET"])
def list_active_variants(product_id):
    variants = ProductVariant.query.filter_by(product_id=product_id, is_active=True).all()
    return jsonify([v.to_dict(include_internal_ids=True) for v in variants]), 200

# === Admin: List ALL Variants for a Product ===
@variant_bp.route("/api/admin/products/<int:product_id>/variants", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_all_variants(product_id):
    variants = ProductVariant.query.filter_by(product_id=product_id).all()
    return jsonify([v.to_dict(include_internal_ids=True) for v in variants]), 200

# === Admin: Create Variant ===
@variant_bp.route("/api/admin/products/<int:product_id>/variants", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_variant(product_id):
    data = request.get_json()

    # ✅ Validate required fields
    required_fields = ["sku", "quantity", "price"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    try:
        variant = ProductVariant(
            product_id=product_id,
            sku=data["sku"],
            size=data.get("size"),
            color=data.get("color"),
            quantity=data["quantity"],
            price=data["price"],
            discount_price=data.get("discount_price"),
            image_url=data.get("image_url"),
            max_per_customer=data.get("max_per_customer")
        )
        db.session.add(variant)
        db.session.commit()
        return jsonify(variant.to_dict(include_internal_ids=True)), 201

    except Exception as e:
        db.session.rollback()
        print("❌ Variant creation failed:", e)
        return jsonify({"error": "Server error creating variant"}), 500

# === Admin: Update Variant ===
@variant_bp.route("/api/admin/variants/<int:variant_id>", methods=["PUT"])
@jwt_required()
@role_required("admin")
def update_variant(variant_id):
    variant = ProductVariant.query.get_or_404(variant_id)
    data = request.get_json()
    for field in ["sku", "size", "color", "quantity", "price", "discount_price", "max_per_customer", "image_url"]:
        if field in data:
            setattr(variant, field, data[field])
    db.session.commit()
    return jsonify(variant.to_dict(include_internal_ids=True)), 200

# === Admin: Enable / Disable Variant ===
@variant_bp.route("/api/admin/products/<int:product_id>/variants/<int:variant_id>/<action>", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def toggle_variant(product_id, variant_id, action):
    variant = ProductVariant.query.filter_by(id=variant_id, product_id=product_id).first_or_404()
    if action == "disable":
        variant.is_active = False
    elif action == "enable":
        variant.is_active = True
    else:
        return jsonify({"error": "Invalid action"}), 400
    db.session.commit()
    return jsonify({"message": f"Variant {action}d"}), 200