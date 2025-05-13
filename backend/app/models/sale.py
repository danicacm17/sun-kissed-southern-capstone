from app.extensions import db
from datetime import datetime
from pytz import timezone

# Use US Eastern Time
eastern = timezone("US/Eastern")

# Association table for many-to-many relationship
sale_variant = db.Table(
    "sale_variant",
    db.Column("sale_id", db.Integer, db.ForeignKey("sales.id"), primary_key=True),
    db.Column("variant_id", db.Integer, db.ForeignKey("product_variants.id"), primary_key=True)
)

class Sale(db.Model):
    __tablename__ = "sales"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    discount_type = db.Column(db.String(10), nullable=False)  # "percent" or "amount"
    discount_value = db.Column(db.Float, nullable=False)

    start_date = db.Column(db.DateTime, default=lambda: datetime.now(eastern))
    end_date = db.Column(db.DateTime)

    # Optional targeting
    category = db.Column(db.String(100), nullable=True)  # Applies to category
    variants = db.relationship("ProductVariant", secondary=sale_variant, backref="sales")

    def is_active(self):
        now = datetime.now(eastern)
        return (self.start_date <= now) and (not self.end_date or now <= self.end_date)
