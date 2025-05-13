"""
Routes for managing inventory logs (admin only).
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.inventory_log import InventoryLog
from app.utils.auth import role_required

inventory_bp = Blueprint("inventory", __name__)

# === Get All Inventory Logs ===
@inventory_bp.route("/api/admin/inventory-logs", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_inventory_logs():
    """
    Return all inventory log entries (admin only), newest first.
    """
    logs = InventoryLog.query.order_by(InventoryLog.created_at.desc()).all()
    return jsonify([log.serialize() for log in logs]), 200

# === Create New Inventory Log Entry ===
@inventory_bp.route("/api/admin/inventory-logs", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_inventory_log():
    """
    Create a new inventory log entry (admin only).
    Required fields: variant_id, change_type, quantity_before, quantity_after, reason
    """
    data = request.get_json()
    required_fields = ["variant_id", "change_type", "quantity_before", "quantity_after", "reason"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400

    log = InventoryLog(
        product_variant_id=data["variant_id"],
        admin_id=get_jwt_identity(),
        change_type=data["change_type"],
        quantity_before=data["quantity_before"],
        quantity_after=data["quantity_after"],
        reason=data["reason"]
    )

    db.session.add(log)
    db.session.commit()
    return jsonify({"log": log.serialize()}), 201
