"""Routes for managing customer return requests and admin processing logic."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from pytz import timezone
from app.extensions import db
from app.models.returns import Return
from app.models.order import OrderItem
from app.models.product_variant import ProductVariant
from app.models.user import User
from app.services.cardknox import send_cardknox_refund
from app.services.email import send_return_email
from app.utils.jwt_helpers import extract_user_info
from app.utils.auth import role_required

return_bp = Blueprint("returns", __name__)
eastern = timezone("US/Eastern")

# === Request a Return ===
@return_bp.route("/api/returns", methods=["POST"])
@jwt_required()
@role_required("admin", "customer_service")
def request_return():
    """
    Create a return request for an order item.
    Only allowed if the item has not already been fully returned or cancelled.
    """
    user_id, _ = extract_user_info()
    data = request.get_json()
    order_item_id = data.get("order_item_id")
    reason = data.get("reason")

    if not reason or not order_item_id:
        return jsonify({"error": "Missing reason or item ID"}), 400

    existing = Return.query.filter_by(order_item_id=order_item_id).first()
    if existing:
        return jsonify({"error": "Return already requested"}), 400

    item = OrderItem.query.get_or_404(order_item_id)
    returnable_qty = item.quantity - item.cancelled_quantity - item.returned_quantity

    if returnable_qty <= 0:
        return jsonify({"error": "No quantity left to return"}), 400

    ret = Return(
        order_item_id=order_item_id,
        user_id=item.order.user_id,
        reason=reason,
        quantity=returnable_qty,
        refund_amount=item.price * returnable_qty,
        rma_number=Return.generate_rma_number(),
        created_at=datetime.now(eastern)
    )

    db.session.add(ret)
    db.session.commit()

    return jsonify({
        "message": "Return requested",
        "return_id": ret.id,
        "rma_number": ret.rma_number
    }), 201

# === List All Returns (Admin View) ===
@return_bp.route("/api/admin/returns", methods=["GET"])
@jwt_required()
@role_required("admin", "customer_service")
def list_returns():
    """
    List all return requests with optional status filter.
    """
    status = request.args.get("status")
    query = Return.query.join(User)

    if status:
        query = query.filter(Return.status.ilike(status))

    results = query.order_by(Return.created_at.desc()).all()
    return jsonify([r.to_dict() for r in results]), 200

# === Mark Return as Received (Warehouse) ===
@return_bp.route("/api/returns/<int:return_id>/receive", methods=["PATCH"])
@jwt_required()
@role_required("admin", "fulfillment", "customer_service")
def mark_received(return_id):
    """
    Mark a return as received by fulfillment team.
    """
    ret = Return.query.get_or_404(return_id)
    if ret.status != "Requested":
        return jsonify({"error": "Only requested returns can be received"}), 400

    ret.status = "Received"
    ret.received_at = datetime.now(eastern)
    db.session.commit()

    return jsonify({"message": "Marked as received"}), 200

# === Final Processing: Approve, Refund, or Deny ===
@return_bp.route("/api/admin/returns/<int:return_id>", methods=["PATCH"])
@jwt_required()
@role_required("admin", "customer_service")
def process_return(return_id):
    """
    Process a return: approve, deny, or issue a refund.
    Optionally restock returned items.
    """
    ret = Return.query.get_or_404(return_id)
    data = request.get_json()
    action = data.get("status")
    restock = data.get("restock", False)

    item = OrderItem.query.get_or_404(ret.order_item_id)
    variant = ProductVariant.query.get(item.product_variant_id)

    if action == "Refunded":
        # Simulate refund via Cardknox sandbox
        card_info = {
            "card_number": "4111111111111111",
            "exp": "1226",
            "cvv": "123",
            "zip": item.order.shipping_address.zip_code,
            "name": item.order.shipping_address.full_name
        }
        result = send_cardknox_refund(ret.refund_amount, card_info, item.order.ref_num)
        if result.get("xResult") != "A":
            return jsonify({"error": "Refund declined", "reason": result.get("xError")}), 402

        ret.status = "Refunded"
        item.status = "refunded"
        send_return_email(item.order.user.email, ret)

    elif action == "Approved":
        ret.status = "Approved"
        item.status = "returned"

    elif action == "Denied":
        ret.status = "Denied"

    ret.processed_at = datetime.now(eastern)

    # Increment returned quantity and finalize item status
    if action in ["Approved", "Refunded"]:
        item.returned_quantity += ret.quantity
        if item.returned_quantity + item.cancelled_quantity >= item.quantity:
            item.status = "returned"

    # Restock inventory if applicable
    if restock and action in ["Approved", "Refunded"] and variant:
        variant.quantity += ret.quantity

    db.session.commit()
    return jsonify(ret.to_dict()), 200

# === Reopen a Denied Return ===
@return_bp.route("/api/returns/<int:return_id>/reopen", methods=["PATCH"])
@jwt_required()
@role_required("admin", "customer_service")
def reopen_return(return_id):
    """
    Reopen a previously denied return request.
    """
    ret = Return.query.get_or_404(return_id)

    if ret.status != "Denied":
        return jsonify({"error": "Only denied returns can be reopened"}), 400

    ret.status = "Requested"
    ret.processed_at = None
    ret.received_at = None
    db.session.commit()

    return jsonify({"message": "Return request reopened", "return_id": ret.id}), 200
