from app.extensions import db
from datetime import datetime
from sqlalchemy.orm import validates

class ProductVariant(db.Model):
    __tablename__ = "product_variants"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    sku = db.Column(db.String(100), unique=True, nullable=False)
    size = db.Column(db.String(50))
    color = db.Column(db.String(50))
    image_url = db.Column(db.String(255), nullable=True)
    quantity = db.Column(db.Integer, nullable=False)
    max_per_customer = db.Column(db.Integer, nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    discount_price = db.Column(db.Numeric(10, 2))
    is_active = db.Column(db.Boolean, default=True) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = db.relationship("Product", back_populates="variants")

    @validates("max_per_customer")
    def set_default_max(self, key, value):
        return value or self.quantity
    
    @validates("sku")
    def validate_sku(self, key, value):
        if not value or not value.strip():
            raise ValueError("SKU is required and cannot be empty")
        return value

    def to_dict(self, include_internal_ids=False):
        data = {
            "sku": self.sku,
            "size": self.size,
            "color": self.color,
            "image_url": self.image_url,
            "quantity": self.quantity,
            "price": float(self.price),
            "discount_price": float(self.discount_price) if self.discount_price else None,
            "max_per_customer": self.max_per_customer,
            "is_active": self.is_active
        }
        if include_internal_ids:
            data["id"] = self.id
            data["product_id"] = self.product_id
        return data

    def serialize(self):
        return self.to_dict(include_internal_ids=True)
