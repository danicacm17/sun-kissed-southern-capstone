from app.extensions import db
from datetime import datetime

class InventoryLog(db.Model):
    __tablename__ = "inventory_logs"

    id = db.Column(db.Integer, primary_key=True)
    product_variant_id = db.Column(db.Integer, db.ForeignKey("product_variants.id"), nullable=False)
    admin_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    change_type = db.Column(db.String(50), nullable=False)
    quantity_before = db.Column(db.Integer)
    quantity_after = db.Column(db.Integer)
    reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    product_variant = db.relationship("ProductVariant")
    admin = db.relationship("User")

    def serialize(self):
        return {
            "id": self.id,
            "variant_id": self.product_variant_id,
            "admin_id": self.admin_id,
            "change_type": self.change_type,
            "quantity_before": self.quantity_before,
            "quantity_after": self.quantity_after,
            "reason": self.reason,
            "created_at": self.created_at.isoformat()
        }
