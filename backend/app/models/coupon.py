from datetime import datetime
from pytz import timezone
from app.extensions import db

eastern = timezone("US/Eastern")

class Coupon(db.Model):
    __tablename__ = "coupons"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    type = db.Column(db.String(10), nullable=False)  # "fixed" or "percent"
    amount = db.Column(db.Float, nullable=False)
    min_order_value = db.Column(db.Float, default=0)
    expires_at = db.Column(db.DateTime, nullable=True)
    max_uses = db.Column(db.Integer, default=1)
    times_used = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)

    usages = db.relationship("CouponUsage", backref="coupon", lazy=True)

    def is_valid(self, cart_total, user_id=None):
        if not self.is_active:
            return False
        if self.expires_at and self.expires_at < datetime.now(eastern):
            return False
        if self.times_used >= self.max_uses:
            return False
        if cart_total < self.min_order_value:
            return False
        if user_id:
            usage = CouponUsage.query.filter_by(user_id=user_id, coupon_id=self.id).first()
            if usage:
                return False
        return True

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "type": self.type,
            "amount": self.amount,
            "min_order_value": self.min_order_value,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "max_uses": self.max_uses,
            "times_used": self.times_used,
            "is_active": self.is_active,
        }


class CouponUsage(db.Model):
    __tablename__ = "coupon_usages"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    coupon_id = db.Column(db.Integer, db.ForeignKey("coupons.id"), nullable=False)
    used_at = db.Column(db.DateTime, default=lambda: datetime.now(eastern))

    user = db.relationship("User", backref="coupon_usages")
