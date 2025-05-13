"""
Admin routes for managing users, products, inventory, fulfillment, and analytics.
Protected via role-based access control (admin or fulfillment roles).
"""

# === Imports ===
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc
from sqlalchemy.orm import joinedload
from datetime import datetime
from pytz import timezone

from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.inventory_log import InventoryLog
from app.models.order import Order, OrderItem
from app.models.address import ShippingAddress
from app.models.returns import Return
from app.utils.auth import role_required

admin_bp = Blueprint("admin", __name__)
eastern = timezone("US/Eastern")


# === Utility ===
def to_eastern(utc_dt):
    """Convert UTC datetime to US/Eastern timezone in ISO format."""
    if utc_dt:
        return utc_dt.replace(tzinfo=timezone("UTC")).astimezone(eastern).isoformat()
    return None

# === Inventory & Fulfillment ===
@admin_bp.route("/api/admin/alerts/low-stock", methods=["GET"])
@jwt_required()
@role_required("admin")
def low_stock_alert():
    """Get all variants below the stock threshold (default: 5)."""
    threshold = int(request.args.get("threshold", 5))
    variants = ProductVariant.query.filter(ProductVariant.quantity < threshold).order_by(ProductVariant.quantity.asc()).all()
    return jsonify([{
        "id": v.id,
        "product_id": v.product_id,
        "sku": v.sku,
        "color": v.color,
        "size": v.size,
        "quantity": v.quantity
    } for v in variants]), 200


@admin_bp.route("/api/admin/fulfillment", methods=["GET"])
@jwt_required()
@role_required("admin", "fulfillment")
def get_fulfillment_orders():
    """Get all orders with items requiring fulfillment (status: paid/fulfilled/backordered)."""
    valid_statuses = ["paid", "fulfilled", "backordered"]
    orders = (
        Order.query
        .options(
            joinedload(Order.items).joinedload(OrderItem.variant),
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.shipping_address),
            joinedload(Order.user)
        )
        .join(Order.items)
        .filter(OrderItem.status.in_(valid_statuses))
        .distinct()
        .order_by(Order.created_at.desc())
        .all()
    )

    result = []
    for order in orders:
        items = [
            {
                "order_item_id": item.id,
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
            }
            for item in order.items if item.status in valid_statuses
        ]
        if items:
            result.append({
                "id": order.id,
                "order_number": order.order_number,
                "status": order.status,
                "created_at": to_eastern(order.created_at),
                "shipping_address": {
                    "full_name": order.shipping_address.full_name,
                    "street": order.shipping_address.street,
                    "city": order.shipping_address.city,
                    "state": order.shipping_address.state,
                    "zip_code": order.shipping_address.zip_code
                },
                "user": {
                    "name": f"{order.user.first_name} {order.user.last_name}",
                    "email": order.user.email
                },
                "items": items
            })

    return jsonify(result), 200


# === Admin Analytics ===
@admin_bp.route("/api/admin/analytics", methods=["GET"])
@jwt_required()
@role_required("admin")
def admin_analytics():
    """Return full dashboard analytics data."""
    # 1. Orders by location
    orders_by_location = db.session.query(
        ShippingAddress.city, func.count(Order.id)
    ).join(Order).group_by(ShippingAddress.city).all()

    # 2. Revenue by day
    revenue_by_day = db.session.query(
        func.date(Order.created_at), func.sum(Order.total)
    ).group_by(func.date(Order.created_at)).all()

    # 3. Top customers
    top_customers = db.session.query(
        User.first_name, User.last_name, User.email, func.sum(Order.total).label("total_spent")
    ).join(Order).group_by(User.id).order_by(desc("total_spent")).limit(5).all()

    # 4. Low stock alerts
    low_stock_alerts = ProductVariant.query.filter(ProductVariant.quantity < 5).all()

    # 5. Fulfillment summary
    recent_orders = (
        Order.query
        .options(
            joinedload(Order.items).joinedload(OrderItem.variant),
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.shipping_address)
        )
        .order_by(Order.created_at.desc())
        .all()
    )

    fulfillment_summary = []
    for order in recent_orders:
        for item in order.items:
            if item.status in ["paid", "fulfilled", "backordered", "partially_fulfilled"]:
                fulfillment_summary.append({
                    "order_number": order.order_number,
                    "status": item.status,
                    "recipient": order.shipping_address.full_name,
                    "product_name": item.product.name,
                    "product_sku": item.product.sku,
                    "variant_sku": item.variant.sku,
                    "color": item.variant.color,
                    "size": item.variant.size,
                    "quantity": item.quantity,
                    "price": float(item.price)
                })

    return jsonify({
        "orders_by_location": [{"city": c, "count": n} for c, n in orders_by_location],
        "revenue_by_day": [{"date": str(d), "revenue": str(r)} for d, r in revenue_by_day],
        "top_customers": [
            {"first_name": f, "last_name": l, "email": e, "total_spent": str(t)}
            for f, l, e, t in top_customers
        ],
        "low_stock_alerts": [
            {
                "sku": v.sku,
                "product_id": v.product.id,
                "product_name": v.product.name,
                "product_sku": v.product.sku,
                "color": v.color,
                "size": v.size,
                "quantity": v.quantity
            } for v in low_stock_alerts
        ],
        "fulfillment_summary": fulfillment_summary
    })


# === User Management ===
@admin_bp.route("/api/admin/users", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_users():
    """Return paginated list of all users."""
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    offset = (page - 1) * limit

    query = User.query
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    return jsonify({
        "users": [ {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.name
        } for user in users ],
        "page": page,
        "limit": limit,
        "total_users": total,
        "total_pages": (total + limit - 1) // limit
    }), 200


@admin_bp.route("/api/admin/users/<int:user_id>", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_user_details(user_id):
    """Get user profile and all associated orders."""
    user = User.query.get_or_404(user_id)
    orders = [ {
        "id": o.id,
        "order_number": o.order_number,
        "status": o.status,
        "total": str(o.total),
        "created_at": o.created_at.isoformat(),
        "shipping_address": o.shipping_address.to_dict() if o.shipping_address else None,
        "billing_address": o.billing_address.to_dict() if o.billing_address else None
    } for o in user.orders ]
    return jsonify({
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.name if user.role else "user",
        "created_at": user.created_at.isoformat(),
        "orders": orders
    })

# === Analytics: Top Selling Products ===
@admin_bp.route("/api/admin/analytics/top-products", methods=["GET"])
@jwt_required()
@role_required("admin")
def top_products():
    """Get top-selling products by quantity and revenue."""
    limit = int(request.args.get("limit", 5))

    results = db.session.query(
        Product.name,
        db.func.sum(OrderItem.quantity).label("total_quantity"),
        db.func.sum(OrderItem.price * OrderItem.quantity).label("total_revenue")
    ).join(Product, Product.id == OrderItem.product_id) \
     .group_by(Product.name) \
     .order_by(db.desc("total_quantity")) \
     .limit(limit).all()

    return jsonify([
        {
            "name": r[0],
            "total_quantity": int(r[1]),
            "total_revenue": float(r[2])
        } for r in results
    ]), 200


# === Analytics: Top Customers ===
@admin_bp.route("/api/admin/analytics/top-customers", methods=["GET"])
@jwt_required()
@role_required("admin")
def top_customers():
    """Get top customers by total amount spent."""
    limit = int(request.args.get("limit", 5))

    results = db.session.query(
        User.first_name,
        User.last_name,
        User.email,
        db.func.sum(Order.total).label("total_spent")
    ).join(Order, Order.user_id == User.id) \
     .group_by(User.id) \
     .order_by(db.desc("total_spent")) \
     .limit(limit).all()

    return jsonify([
        {
            "first_name": r[0],
            "last_name": r[1],
            "email": r[2],
            "total_spent": float(r[3])
        } for r in results
    ]), 200


# === Analytics: Order Export ===
@admin_bp.route("/api/admin/analytics/orders", methods=["GET"])
@jwt_required()
@role_required("admin")
def all_order_report():
    """Export all orders, filterable by status and date range."""
    status = request.args.get("status")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    query = Order.query
    if status:
        query = query.filter(Order.status == status)
    if start_date:
        query = query.filter(Order.created_at >= start_date)
    if end_date:
        query = query.filter(Order.created_at <= end_date)

    orders = query.order_by(Order.created_at.desc()).all()

    return jsonify([{
        "order_number": o.order_number,
        "created_at": o.created_at.isoformat(),
        "status": o.status,
        "total": str(o.total),
        "user": {
            "id": o.user.id,
            "first_name": o.user.first_name,
            "last_name": o.user.last_name,
            "email": o.user.email
        },
        "shipping": {
            "name": o.shipping_address.full_name,
            "address": f"{o.shipping_address.street}, {o.shipping_address.city}, {o.shipping_address.state} {o.shipping_address.zip_code}"
        },
        "billing": {
            "name": o.billing_address.full_name,
            "address": f"{o.billing_address.street}, {o.billing_address.city}, {o.billing_address.state} {o.billing_address.zip_code}"
        },
        "items": [{
            "product_id": item.product_id,
            "variant_id": item.product_variant_id,
            "quantity": item.quantity,
            "price": str(item.price)
        } for item in o.items]
    } for o in orders]), 200


# === Analytics: Return Rates & Abuse Detection ===
@admin_bp.route("/api/admin/analytics/returns", methods=["GET"])
@jwt_required()
@role_required("admin", "customer_service")
def return_analytics():
    """Analyze return volume, reasons, and potential abuse patterns."""
    status = request.args.get("status")
    user = request.args.get("user")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    query = db.session.query(Return)
    if status:
        query = query.filter(Return.status.ilike(status))
    if start_date:
        query = query.filter(Return.created_at >= start_date)
    if end_date:
        query = query.filter(Return.created_at <= end_date)
    if user:
        query = query.join(User).filter(User.email.ilike(f"%{user}%"))

    total_returns = query.count()
    total_items_returned = query.with_entities(func.sum(Return.quantity)).scalar() or 0
    total_items_sold = db.session.query(func.sum(OrderItem.quantity)).scalar() or 0
    return_rate = round((total_items_returned / total_items_sold) * 100, 2) if total_items_sold else 0

    reasons = query.with_entities(Return.reason, func.count(Return.id).label("count")) \
        .group_by(Return.reason).order_by(desc("count")).limit(5).all()
    reasons_list = [{"reason": r[0], "count": r[1]} for r in reasons]

    abusers = db.session.query(
        User.first_name,
        User.last_name,
        User.email,
        func.count(Return.id).label("return_count")
    ).join(Return, Return.user_id == User.id) \
     .group_by(User.id) \
     .having(func.count(Return.id) > 2).all()

    abusers_list = [{
        "first_name": u[0],
        "last_name": u[1],
        "email": u[2],
        "return_count": u[3]
    } for u in abusers]

    return jsonify({
        "total_returns": total_returns,
        "total_items_returned": total_items_returned,
        "total_items_sold": total_items_sold,
        "return_rate": f"{return_rate}%",
        "common_reasons": reasons_list,
        "abusers": abusers_list
    }), 200
