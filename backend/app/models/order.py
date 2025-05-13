from app.extensions import db
from datetime import datetime
from sqlalchemy.orm import validates
from pytz import timezone
import random
import string

eastern = timezone("US/Eastern")

class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(20), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    total = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(30), nullable=False, default="paid", server_default="paid")
    ref_num = db.Column(db.String(50), nullable=True)
    tracking_number = db.Column(db.String(50), nullable=True)  # Deprecated, use item-level tracking
    tracking_status = db.Column(db.String(50), default="created")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(eastern))

    user = db.relationship("User", backref="orders")
    items = db.relationship("OrderItem", backref="order", cascade="all, delete-orphan")
    shipping_address = db.relationship("ShippingAddress", back_populates="order", uselist=False)
    billing_address = db.relationship("BillingAddress", back_populates="order", uselist=False)

    @staticmethod
    def generate_order_number():
        prefix = "SKS"
        suffix = ''.join(random.choices(string.digits, k=6))
        return f"{prefix}{suffix}"

    @validates("order_number")
    def validate_order_number(self, key, value):
        assert value and len(value) <= 20
        return value

    @validates("status")
    def validate_status(self, key, value):
        valid_statuses = [
            "pending", "paid", "in_fulfillment", "fulfilled", "partially_fulfilled",
            "shipped", "partially_shipped", "cancelled",
            "return_requested", "return_received", "return_denied", "returned",
            "payment_denied"
        ]
        if value not in valid_statuses:
            raise ValueError(f"Invalid order status: {value}")
        return value


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    product_variant_id = db.Column(db.Integer, db.ForeignKey("product_variants.id"), nullable=True)
    quantity = db.Column(db.Integer, nullable=False)  # total ordered
    cancelled_quantity = db.Column(db.Integer, default=0, nullable=False)  # ✅
    returned_quantity = db.Column(db.Integer, default=0, nullable=False)   # ✅
    price = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="paid")
    tracking_number = db.Column(db.String, nullable=True)

    product = db.relationship("Product", backref="order_items")
    variant = db.relationship("ProductVariant")

    @validates("status")
    def validate_status(self, key, value):
        valid_statuses = [
            "paid", "fulfilled", "shipped", "backordered",
            "cancelled", "returned", "refunded"
        ]
        if value not in valid_statuses:
            raise ValueError(f"Invalid item status: {value}")
        return value
