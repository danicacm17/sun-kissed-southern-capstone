from app.extensions import db
from datetime import datetime
from pytz import timezone

# Use US Eastern Time
eastern = timezone("US/Eastern")

class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(50), nullable=True)
    stock = db.Column(db.Integer, nullable=False, default=0)
    sku = db.Column(db.String(50), unique=True, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(eastern))
    updated_at = db.Column(db.DateTime, onupdate=lambda: datetime.now(eastern))

    # Relationships
    variants = db.relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    favorited_by = db.relationship("Favorite", back_populates="product", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "image_url": self.image_url,
            "category": self.category,
            "sku": self.sku,
            "stock": self.stock,
            "is_active": self.is_active
        }

    def get_average_rating(self):
        approved_reviews = [r.rating for r in self.reviews if r.approved]
        return round(sum(approved_reviews) / len(approved_reviews), 1) if approved_reviews else None

    def to_dict(self, include_variants=False):
        data = {
            "id": self.id,
            "name": self.name,
            "sku": self.sku,
            "description": self.description,
            "category": self.category,
            "image_url": self.image_url,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_variants:
            data["variants"] = [v.to_dict(include_internal_ids=True) for v in self.variants]

        return data

