from app.extensions import db
from datetime import datetime

class Favorite(db.Model):
    __tablename__ = "favorites"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="favorites")
    product = db.relationship("Product", back_populates="favorited_by")

    def to_dict(self):
        return {
            "product": self.product.to_dict(),
            "favorited_at": self.created_at.isoformat()
        }
