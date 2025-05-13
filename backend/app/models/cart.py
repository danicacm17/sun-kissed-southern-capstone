# cart.py
#
# === ⚠️ CART MODELS TEMPORARILY UNUSED ===
#
# The Cart and CartItem models are defined for future support of server-side cart storage,
# but are not currently used. The cart is handled on the frontend via localStorage.
#
# These models may be reactivated later if persistent carts are needed.


# from datetime import datetime
# from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
# from sqlalchemy.orm import relationship
# from app.extensions import db

# class Cart(db.Model):
#     """Shopping cart associated with a user."""
#     __tablename__ = "carts"

#     id = Column(Integer, primary_key=True)
#     user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
#     created_at = Column(DateTime, default=datetime.utcnow)

#     # Relationships
#     user = relationship("User", back_populates="cart")
#     items = relationship("CartItem", cascade="all, delete-orphan", back_populates="cart")

#     def __repr__(self):
#         return f"<Cart id={self.id} user_id={self.user_id}>"

# class CartItem(db.Model):
#     """Items inside a user's shopping cart."""
#     __tablename__ = "cart_items"
#     __table_args__ = (
#         UniqueConstraint("cart_id", "product_variant_id", name="uq_cart_variant"),
#     )

#     id = Column(Integer, primary_key=True)
#     cart_id = Column(Integer, ForeignKey("carts.id"), nullable=False)
#     product_variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False)
#     quantity = Column(Integer, nullable=False)

#     # Relationships
#     cart = relationship("Cart", back_populates="items")
#     product_variant = relationship("ProductVariant", back_populates="cart_items")

#     def __repr__(self):
#         return f"<CartItem id={self.id} cart_id={self.cart_id} variant={self.product_variant_id} qty={self.quantity}>"

#     def to_dict(self):
#         return {
#             "id": self.id,
#             "product_variant_id": self.product_variant_id,
#             "quantity": self.quantity,
#             "variant_details": self.product_variant.to_dict() if self.product_variant else None
#         }
