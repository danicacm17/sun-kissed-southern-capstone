"""Routes for managing orders, including checkout and admin operations."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from decimal import Decimal
from datetime import datetime
from pytz import timezone
import uuid

from app.extensions import db
from app.models.order import Order, OrderItem
from app.models.address import ShippingAddress, BillingAddress
from app.models.product_variant import ProductVariant
from app.models.returns import Return
from app.models.coupon import Coupon
from app.models.sale import Sale
from app.services.cardknox import send_cardknox_payment
from app.services.email import send_confirmation_email
from app.utils.jwt_helpers import extract_user_info
from app.utils.auth import role_required

order_bp = Blueprint("orders", __name__)
eastern = timezone("US/Eastern")

def infer_order_status(order):
    """Determine the overall status of an order based on its items."""
    statuses = [item.status for item in order.items]
    if any(s == "backorder" for s in statuses):
        return "in_fulfillment"
    if all(s == "paid" for s in statuses):
        return "paid"
    if all(s == "fulfilled" for s in statuses):
        return "fulfilled"
    if all(s == "shipped" for s in statuses):
        return "shipped"
    if any(s == "shipped" for s in statuses):
        return "partially_shipped"
    if any(s == "fulfilled" for s in statuses):
        return "partially_fulfilled"
    return "in_fulfillment"

@order_bp.route("/api/checkout", methods=["POST"])
@jwt_required()
def checkout():
    """Handle the checkout process for a user."""
    from decimal import Decimal
    data = request.get_json()
    identity = get_jwt_identity()
    user_id = identity["id"] if isinstance(identity, dict) else identity

    cart_items = data.get("cart", [])
    payment_info = data.get("payment_info")
    shipping_address = data.get("shipping_address")
    billing_same = data.get("billing_same_as_shipping", False)
    billing_data = data.get("billing_address") or {}
    coupon_code = data.get("coupon_code", "").upper()

    if not cart_items or not payment_info or not shipping_address:
        return jsonify({"error": "Missing required fields"}), 400

    for field in ("card_number", "expiration_date", "cvv"):
        if not payment_info.get(field):
            return jsonify({"error": f"Missing {field}"}), 400

    coupon = Coupon.query.filter_by(code=coupon_code, is_active=True).first() if coupon_code else None

    order_items = []
    total = Decimal("0.00")

    for item in cart_items:
        variant = ProductVariant.query.options(joinedload(ProductVariant.product)).get(item["product_variant_id"])
        if not variant:
            continue

        quantity = item.get("quantity", 1)

        # Ensure stock availability
        if variant.quantity < quantity:
            return jsonify({"error": f"Not enough stock for {variant.sku}"}), 400

        # Use price provided from frontend (already discounted by sales)
        client_price = Decimal(str(item.get("unit_price", variant.price)))
        line_total = client_price * quantity
        total += line_total
        variant.quantity -= quantity

        order_items.append(OrderItem(
            product_id=variant.product_id,
            product_variant_id=variant.id,
            quantity=quantity,
            price=client_price,
            status="paid"
        ))

    # === Coupon logic applied after all items ===
    if coupon:
        if coupon.min_order_value and total < Decimal(coupon.min_order_value):
            return jsonify({"error": "Coupon requires minimum order"}), 400
        if coupon.type == "percent":
            discount = (total * Decimal(coupon.amount) / Decimal("100")).quantize(Decimal("0.01"))
        else:
            discount = Decimal(coupon.amount)
        total -= discount
        total = max(total, Decimal("0.00"))

    # === Handle payment ===
    try:
        payment_result = send_cardknox_payment(total, payment_info)
        if payment_result.get("xResult") != "A":
            return jsonify({"error": "Payment declined", "reason": payment_result.get("xError")}), 402
    except Exception as e:
        print("⚠️ Cardknox fallback mode:", e)
        payment_result = {"xRefNum": "DEV-MOCK-12345"}

    # === Addresses ===
    shipping = ShippingAddress(**shipping_address)
    billing = BillingAddress(**(shipping_address if billing_same else billing_data))
    db.session.add(shipping)
    db.session.add(billing)

    # === Create order ===
    order = Order(
        user_id=user_id,
        total=total,
        shipping_address=shipping,
        billing_address=billing,
        items=order_items,
        status="paid",
        ref_num=payment_result.get("xRefNum"),
        order_number=f"SKS{uuid.uuid4().hex[:7].upper()}"
    )

    db.session.add(order)
    db.session.commit()

    # === Track coupon usage ===
    if coupon:
        coupon.times_used += 1
        db.session.commit()

    send_confirmation_email(order.user.email, order)

    return jsonify({
        "message": "Order placed",
        "order_number": order.order_number
    }), 201

@order_bp.route("/api/admin/orders/item/<int:order_item_id>/fulfill", methods=["PATCH"])
@jwt_required()
@role_required("admin", "fulfillment")
def fulfill_item(order_item_id):
    """Mark an order item as fulfilled."""
    try:
        item = OrderItem.query.get_or_404(order_item_id)
        if item.status not in ["paid", "backordered"]:
            return jsonify({"error": "Only 'paid' or 'backordered' items can be fulfilled"}), 400

        item.status = "fulfilled"
        item.order.status = infer_order_status(item.order)

        db.session.commit()
        return jsonify({"message": f"Item {item.id} marked as fulfilled"}), 200
    except Exception as e:
        print("❌ Fulfill route error:", e)
        return jsonify({"error": "Internal server error"}), 500

@order_bp.route("/api/admin/orders/item/<int:order_item_id>/backorder", methods=["PATCH"])
@jwt_required()
@role_required("admin", "fulfillment")
def backorder_item(order_item_id):
    """Mark an order item as backordered."""
    try:
        item = OrderItem.query.get_or_404(order_item_id)
        print(f"✅ Found OrderItem ID {order_item_id} with current status: {item.status}")

        if item.status not in ["paid", "fulfilled"]:
            print("❌ Invalid status for backorder:", item.status)
            return jsonify({"error": "Only paid or fulfilled items can be backordered"}), 400

        item.status = "backordered"

        if not item.order:
            print("❌ Item has no associated order!")
            return jsonify({"error": "Order not found"}), 500

        item.order.status = infer_order_status(item.order)
        print(f"🔁 Updated order status to: {item.order.status}")

        db.session.commit()
        print(f"✅ Successfully marked item {item.id} as backordered")
        return jsonify({"message": f"Item {item.id} marked as backordered"}), 200

    except Exception as e:
        print("❌ Error in backorder route:", str(e))
        return jsonify({"error": "Internal server error"}), 500

@order_bp.route("/api/admin/orders/item/<int:order_item_id>/ship", methods=["PATCH"])
@jwt_required()
@role_required("admin", "fulfillment")
def ship_item(order_item_id):
    """Mark an order item as shipped with a tracking number."""
    item = OrderItem.query.get_or_404(order_item_id)
    data = request.get_json()
    tracking_number = data.get("tracking_number")
    
    if not tracking_number:
        return jsonify({"error": "Tracking number is required"}), 400
    if item.status != "fulfilled":
        return jsonify({"error": "Only fulfilled items can be shipped"}), 400

    item.status = "shipped"
    item.tracking_number = tracking_number

    order = item.order
    order.status = infer_order_status(order)

    db.session.commit()
    return jsonify({"message": f"Item {item.id} shipped with tracking."}), 200

@order_bp.route("/api/admin/orders/<int:order_item_id>/cancel", methods=["PATCH"])
@jwt_required()
@role_required("admin", "customer_service")
def cancel_item(order_item_id):
    """Cancel a specified quantity of an order item."""
    item = OrderItem.query.get_or_404(order_item_id)
    data = request.get_json()
    restock = data.get("restock", False)
    cancel_quantity = data.get("cancel_quantity", 1)

    fulfillable_qty = item.quantity - item.cancelled_quantity - item.returned_quantity
    if cancel_quantity > fulfillable_qty:
        return jsonify({"error": "Cancel quantity exceeds fulfillable quantity"}), 400

    item.cancelled_quantity += cancel_quantity

    if restock:
        variant = ProductVariant.query.get(item.product_variant_id)
        if variant:
            variant.quantity += cancel_quantity

    if item.cancelled_quantity + item.returned_quantity >= item.quantity:
        item.status = "cancelled"

    item.order.status = infer_order_status(item.order)
    db.session.commit()

    return jsonify({"message": f"Cancelled {cancel_quantity} unit(s)"}), 200

@order_bp.route("/api/admin/orders", methods=["GET"])
@jwt_required()
@role_required("admin", "customer_service")
def get_all_orders():
    """Retrieve all orders with detailed info including items and addresses."""
    orders = Order.query.options(
        joinedload(Order.user),
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.items).joinedload(OrderItem.variant),
        joinedload(Order.shipping_address),
        joinedload(Order.billing_address)
    ).order_by(Order.created_at.desc()).all()

    result = []
    for order in orders:
        result.append({
            "id": order.id,
            "order_number": order.order_number,
            "status": order.status,
            "total": float(order.total),
            "created_at": order.created_at.astimezone(eastern).isoformat(),
            "user": {
                "name": f"{order.user.first_name} {order.user.last_name}",
                "email": order.user.email
            },
            "shipping_address": {
                "full_name": order.shipping_address.full_name,
                "street": order.shipping_address.street,
                "city": order.shipping_address.city,
                "state": order.shipping_address.state,
                "zip_code": order.shipping_address.zip_code
            } if order.shipping_address else None,
            "billing_address": {
                "full_name": order.billing_address.full_name,
                "street": order.billing_address.street,
                "city": order.billing_address.city,
                "state": order.billing_address.state,
                "zip_code": order.billing_address.zip_code
            } if order.billing_address else None,
            "items": [
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
                    "tracking_number": item.tracking_number,
                    "return_requested": bool(item.returns),
                    "return_status": item.returns[0].status if item.returns else None
                } for item in order.items
            ]
        })

    return jsonify(result), 200

@order_bp.route("/api/admin/orders/<int:order_item_id>/tracking", methods=["PATCH"])
@jwt_required()
@role_required("admin", "customer_service")
def update_tracking_number(order_item_id):
    """Update the tracking number for a specific order item."""
    data = request.get_json()
    tracking_number = data.get("tracking_number")

    if not tracking_number:
        return jsonify({"error": "Tracking number is required"}), 400

    item = OrderItem.query.get_or_404(order_item_id)
    item.tracking_number = tracking_number
    db.session.commit()

    return jsonify({"message": f"Tracking updated for item {item.id}"}), 200
