from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy.orm import joinedload
from app.extensions import db
from app.models.coupon import Coupon
from app.models.sale import Sale
from app.models.product_variant import ProductVariant
from app.utils.auth import role_required
from datetime import datetime
from pytz import timezone
from decimal import Decimal, ROUND_HALF_UP


eastern = timezone("US/Eastern")

discount_bp = Blueprint("discount", __name__)

# === COUPONS ===

@discount_bp.route("/api/admin/discounts/coupons", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_coupons():
    coupons = Coupon.query.all()
    return jsonify([c.to_dict() for c in coupons]), 200

@discount_bp.route("/api/admin/discounts/coupons", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_coupon():
    data = request.json
    existing = Coupon.query.filter_by(code=data["code"].upper()).first()
    if existing:
        return jsonify({"error": "Coupon code already exists"}), 400

    coupon = Coupon(
        code=data["code"].upper(),
        type=data["type"],
        amount=data["amount"],
        min_order_value=data.get("min_order_value", 0),
        expires_at=datetime.fromisoformat(data["expires_at"]) if data.get("expires_at") else None,
        max_uses=data.get("max_uses", 1),
        is_active=data.get("is_active", True)
    )
    db.session.add(coupon)
    db.session.commit()
    return jsonify(coupon.to_dict()), 201

@discount_bp.route("/api/admin/discounts/coupons/<int:id>", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def update_coupon(id):
    coupon = Coupon.query.get_or_404(id)
    data = request.json
    for field in ["code", "type", "amount", "min_order_value", "max_uses", "is_active"]:
        if field in data:
            setattr(coupon, field, data[field])
    if "expires_at" in data:
        coupon.expires_at = datetime.fromisoformat(data["expires_at"]) if data["expires_at"] else None
    db.session.commit()
    return jsonify(coupon.to_dict()), 200

@discount_bp.route("/api/admin/discounts/coupons/<int:id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def delete_coupon(id):
    coupon = Coupon.query.get_or_404(id)
    db.session.delete(coupon)
    db.session.commit()
    return jsonify({"message": "Coupon deleted"}), 200

@discount_bp.route("/api/coupons/validate", methods=["POST"])
def validate_coupon():
    from decimal import Decimal, ROUND_HALF_UP

    data = request.get_json()
    code = data.get("code")
    subtotal = Decimal(str(data.get("subtotal", "0.00")))

    if not code or subtotal <= 0:
        return jsonify({"error": "Missing code or subtotal"}), 400

    coupon = Coupon.query.filter_by(code=code, is_active=True).first()
    if not coupon:
        return jsonify({"error": "Invalid or expired coupon"}), 404

    # Check minimum order value
    if coupon.min_order_value and subtotal < Decimal(coupon.min_order_value):
        return jsonify({
            "error": "Minimum order not met",
            "min_order_value": float(coupon.min_order_value)
        }), 400

    # Calculate discount from subtotal directly
    if coupon.type == "percent":
        discount = (subtotal * Decimal(coupon.amount) / Decimal("100")).quantize(
            Decimal(".01"), rounding=ROUND_HALF_UP
        )
    else:
        discount = Decimal(coupon.amount)

    discount = min(discount, subtotal)

    return jsonify({
        "code": coupon.code,
        "type": coupon.type,
        "discount": float(discount),
        "original_amount": float(coupon.amount),
        "min_order_value": float(coupon.min_order_value or 0)
    }), 200

# === SALES ===

@discount_bp.route("/api/admin/discounts/sales", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_sales():
    sales = Sale.query.all()
    return jsonify([
        {
            "id": s.id,
            "name": s.name,
            "discount_type": s.discount_type,
            "discount_value": s.discount_value,
            "start_date": s.start_date.isoformat() if s.start_date else None,
            "end_date": s.end_date.isoformat() if s.end_date else None,
            "category": s.category,
            "variant_ids": [v.id for v in s.variants]
        } for s in sales
    ]), 200

@discount_bp.route("/api/admin/discounts/sales", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_sale():
    data = request.json

    # Prevent duplicate sale name
    existing = Sale.query.filter_by(name=data["name"]).first()
    if existing:
        return jsonify({"error": "Sale name already exists"}), 400

    sale = Sale(
        name=data["name"],
        discount_type=data["discount_type"],
        discount_value=data["discount_value"],
        start_date=datetime.fromisoformat(data["start_date"]) if data.get("start_date") else datetime.utcnow(),
        end_date=datetime.fromisoformat(data["end_date"]) if data.get("end_date") else None,
        category=data.get("category")
    )

    variant_skus = data.get("variant_skus", [])
    variants = []

    if variant_skus:
        variants = ProductVariant.query.filter(ProductVariant.sku.in_(variant_skus)).all()
    elif data.get("category"):
        from app.models.product import Product  # ensure this import is at the top
        variants = (
            ProductVariant.query
            .join(Product)
            .filter(Product.category == data["category"])
            .all()
        )

    sale.variants = variants

    db.session.add(sale)
    db.session.commit()
    return jsonify({"message": "Sale created", "id": sale.id}), 201

@discount_bp.route("/api/admin/discounts/sales/<int:id>", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def update_sale(id):
    sale = Sale.query.get_or_404(id)
    data = request.json
    for field in ["name", "discount_type", "discount_value", "category"]:
        if field in data:
            setattr(sale, field, data[field])
    if "start_date" in data:
        sale.start_date = datetime.fromisoformat(data["start_date"]) if data["start_date"] else sale.start_date
    if "end_date" in data:
        sale.end_date = datetime.fromisoformat(data["end_date"]) if data["end_date"] else None
    if "variant_ids" in data:
        sale.variants = ProductVariant.query.filter(ProductVariant.id.in_(data["variant_ids"])).all()

    db.session.commit()
    return jsonify({"message": "Sale updated"}), 200

@discount_bp.route("/api/admin/discounts/sales/<int:id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def delete_sale(id):
    sale = Sale.query.get_or_404(id)
    db.session.delete(sale)
    db.session.commit()
    return jsonify({"message": "Sale deleted"}), 200

@discount_bp.route("/api/sales", methods=["GET"])
def get_active_sales():
    from sqlalchemy.orm import joinedload
    from datetime import datetime

    now = datetime.now()  # ✅ fix: make it naive

    sales = Sale.query.options(joinedload(Sale.variants)).all()
    active_sales = [
        s for s in sales
        if s.start_date <= now and (not s.end_date or s.end_date >= now)
    ]

    result = []
    for sale in active_sales:
        result.append({
            "id": sale.id,
            "title": sale.name,
            "discount_type": sale.discount_type,
            "discount_value": float(sale.discount_value),
            "category": sale.category,
            "variant_ids": [v.id for v in sale.variants]
        })

    return jsonify(result), 200

