from app.extensions import db
from datetime import datetime
from pytz import timezone
import random, string

eastern = timezone("US/Eastern")

class Return(db.Model):
    __tablename__ = "returns"

    id = db.Column(db.Integer, primary_key=True)
    order_item_id = db.Column(db.Integer, db.ForeignKey("order_items.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default="Requested")
    quantity = db.Column(db.Integer, nullable=False, default=1)
    refund_amount = db.Column(db.Numeric(10, 2))
    rma_number = db.Column(db.String(20), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(eastern))
    processed_at = db.Column(db.DateTime)
    received_at = db.Column(db.DateTime, nullable=True)

    order_item = db.relationship("OrderItem", backref="returns")
    user = db.relationship("User", backref="returns")

    @staticmethod
    def generate_rma_number():
        return f"RMA-{''.join(random.choices(string.ascii_uppercase + string.digits, k=8))}"

    def to_dict(self):
        return {
            "id": self.id,
            "order_item_id": self.order_item_id,
            "user_id": self.user_id,
            "reason": self.reason,
            "status": self.status,
            "quantity": self.quantity,
            "refund_amount": str(self.refund_amount) if self.refund_amount else None,
            "rma_number": self.rma_number,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
            "received_at": self.received_at.isoformat() if self.received_at else None,
            "user_email": self.user.email,
            "user_name": f"{self.user.first_name} {self.user.last_name}",
            "order_number": self.order_item.order.order_number,
            "billing_address": {
                "street": self.order_item.order.billing_address.street,
                "city": self.order_item.order.billing_address.city,
                "state": self.order_item.order.billing_address.state,
                "zip_code": self.order_item.order.billing_address.zip_code,
                "country": self.order_item.order.billing_address.country
            },
            "product_name": self.order_item.product.name,
            "product_sku": self.order_item.product.sku,       
            "variant_sku": self.order_item.variant.sku,   
            "variant_color": self.order_item.variant.color,
            "variant_size": self.order_item.variant.size
        }
