"""
Product Routes

Public product listing, filtering, and detail views.
Admin-only product creation, update, enable/disable.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from app.extensions import db
from app.models.product import Product
from app.utils.auth import role_required

product_bp = Blueprint("products", __name__)

# === GET: Public product list with filters, sorting, and pagination ===
@product_bp.route("/api/products", methods=["GET"])
def list_products():
    category = request.args.get("category")
    search = request.args.get("q")
    sort = request.args.get("sort", "created_at_desc")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))
    offset = (page - 1) * limit

    query = Product.query.filter_by(is_active=True)

    if category:
        query = query.filter(Product.category == category)

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    sort_options = {
        "created_at_asc": Product.created_at.asc(),
        "created_at_desc": Product.created_at.desc()
    }
    query = query.order_by(sort_options.get(sort, Product.created_at.desc()))

    total_items = query.count()
    products = query.offset(offset).limit(limit).all()

    return jsonify({
        "page": page,
        "limit": limit,
        "total_items": total_items,
        "total_pages": (total_items + limit - 1) // limit,
        "items": [p.to_dict(include_variants=True) for p in products]
    }), 200

# === GET: Public single product detail by ID ===
@product_bp.route("/api/products/<int:id>", methods=["GET"])
def get_product(id):
    product = Product.query.get_or_404(id)
    return jsonify(product.to_dict(include_variants=True)), 200

# === GET: Public products by category slug (e.g., "tank-tops") ===
@product_bp.route("/api/products/category/<string:category>", methods=["GET"])
def get_products_by_category(category):
    normalized = category.replace("-", "").lower()
    products = Product.query.filter(
        func.replace(func.lower(Product.category), '-', '') == normalized,
        Product.is_active == True
    ).all()
    return jsonify({
        "products": [p.to_dict(include_variants=True) for p in products]
    }), 200

# === GET: Admin-only list of all products with variants ===
@product_bp.route("/api/admin/products", methods=["GET"])
@jwt_required()
@role_required("admin")
def admin_list_products():
    products = Product.query.order_by(Product.created_at.desc()).all()
    return jsonify({
        "items": [p.to_dict(include_variants=True) for p in products],
        "page": 1,
        "limit": len(products),
        "total_items": len(products),
        "total_pages": 1
    }), 200

# === POST: Create a product (admin only) ===
@product_bp.route("/api/admin/products", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_product():
    data = request.get_json()
    new_product = Product(
        name=data.get("name"),
        description=data.get("description"),
        image_url=data.get("image_url"),
        category=data.get("category"),
        sku=data.get("sku"),
        stock=data.get("stock", 0)
    )
    db.session.add(new_product)
    db.session.commit()
    return jsonify({"message": "Product created", "id": new_product.id}), 201

# === PUT: Update a product by ID (admin only) ===
@product_bp.route("/api/admin/products/<int:id>", methods=["PUT"])
@jwt_required()
@role_required("admin")
def update_product(id):
    product = Product.query.get_or_404(id)
    data = request.get_json()

    product.name = data.get("name", product.name)
    product.description = data.get("description", product.description)
    product.image_url = data.get("image_url", product.image_url)
    product.category = data.get("category", product.category)
    product.sku = data.get("sku", product.sku)
    product.stock = data.get("stock", product.stock)

    db.session.commit()
    return jsonify({"message": "Product updated"}), 200

# === PATCH: Disable product and variants (admin only) ===
@product_bp.route("/api/admin/products/<int:id>/disable", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def disable_product(id):
    try:
        product = Product.query.get_or_404(id)
        product.is_active = False
        for variant in product.variants:
            variant.is_active = False
        db.session.commit()
        return jsonify({"message": "Product and variants disabled"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

# === PATCH: Enable product and variants (admin only) ===
@product_bp.route("/api/admin/products/<int:id>/enable", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def enable_product(id):
    try:
        product = Product.query.get_or_404(id)
        product.is_active = True
        for variant in product.variants:
            variant.is_active = True
        db.session.commit()
        return jsonify({"message": "Product and variants reactivated"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


