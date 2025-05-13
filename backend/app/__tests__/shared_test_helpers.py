from datetime import datetime
from uuid import uuid4
from flask_jwt_extended import create_access_token
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.order import Order, OrderItem
from app.models.address import ShippingAddress, BillingAddress

# === Ensure Demo User Exists ===
def ensure_demo_user():
    role = Role.query.filter_by(name="user").first()
    if not role:
        role = Role(name="user")
        db.session.add(role)
        db.session.commit()

    user = User.query.filter_by(email="demo@sks.com").first()
    if not user:
        user = User(
            email="demo@sks.com",
            first_name="Demo",
            last_name="User",
            role_id=role.id
        )
        user.set_password("password123")
        db.session.add(user)
        db.session.commit()
    return user

# === Create Admin User and Token ===
def create_admin_user_and_token():
    role = Role.query.filter_by(name="admin").first()
    if not role:
        role = Role(name="admin")
        db.session.add(role)
        db.session.commit()

    email = f"admin_{uuid4().hex[:6]}@test.com"
    user = User(email=email, role_id=role.id, first_name="Admin", last_name="User")
    user.set_password("adminpass")
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id), additional_claims={"role": "admin"})
    return user, token

# === Create Demo User and Token ===
def create_demo_user_and_token():
    user = ensure_demo_user()
    token = create_access_token(identity=str(user.id), additional_claims={"role": "user"})
    return user, token

# === Create Product and Variant ===
def create_product_and_variant(quantity=10):
    product = Product(
        name=f"Test Product {uuid4().hex[:4]}",
        sku=f"SKU-{uuid4().hex[:6]}",
        description="A test product",
        category="Accessories",
        stock=10,
        is_active=True
    )
    db.session.add(product)
    db.session.flush()

    variant = ProductVariant(
        product_id=product.id,
        sku=f"VAR-{uuid4().hex[:6]}",
        size="M",
        color="Blue",
        price=25.00,
        quantity=quantity,
        is_active=True
    )
    db.session.add(variant)
    db.session.commit()
    return product, variant

# === Create Order with Items ===
def create_order_with_items(user=None, num_items=1, status="paid"):
    user = user or ensure_demo_user()
    product, variant = create_product_and_variant()

    order = Order(
        user_id=user.id,
        status=status,
        total=variant.price * num_items,
        order_number=f"ORD-{uuid4().hex[:6].upper()}",
        created_at=datetime.utcnow()
    )
    db.session.add(order)
    db.session.flush()

    shipping = ShippingAddress(
        order_id=order.id,
        full_name="Test User",
        street="123 Main St",
        city="Testville",
        state="FL",
        zip_code="12345"
    )
    billing = BillingAddress(
        order_id=order.id,
        full_name="Test User",
        street="123 Main St",
        city="Testville",
        state="FL",
        zip_code="12345"
    )
    db.session.add(shipping)
    db.session.add(billing)
    db.session.flush()

    order.shipping_address_id = shipping.id
    order.billing_address_id = billing.id

    for _ in range(num_items):
        item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_variant_id=variant.id,
            quantity=1,
            price=variant.price,
            status=status
        )
        db.session.add(item)

    db.session.commit()
    return order, variant
