import os, uuid
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Load correct env
ENV_MODE = os.getenv("FLASK_ENV", "development")
env_file = ".env.test" if ENV_MODE == "test" else ".env"
print(f"🌱 Loading env from: {env_file}")
load_dotenv(env_file)

from app import create_app
from app.extensions import db
from app.models.product import Product
from app.models.user import User
from app.models.role import Role
from app.models.product_variant import ProductVariant
from app.models.inventory_log import InventoryLog
from app.models.review import Review
from app.models.blog import BlogPost
from app.models.order import Order, OrderItem
from app.models.address import ShippingAddress, BillingAddress
from app.models.returns import Return

app = create_app()

def clear_db():
    print("🧹 Dropping and recreating all tables...")
    db.reflect()
    db.drop_all()
    db.create_all()

def seed_roles():
    print("🔐 Seeding roles...")
    roles = ["admin", "customer_service", "fulfillment", "user"]
    for name in roles:
        if not Role.query.filter_by(name=name).first():
            db.session.add(Role(name=name))
    db.session.commit()

def seed_users():
    print("👥 Seeding users...")
    roles = {r.name: r for r in Role.query.all()}
    users = [
        User(email="admin@sks.com", role_id=roles["admin"].id, first_name="Admin", last_name="User"),
        User(email="demo@sks.com", role_id=roles["user"].id, first_name="Demo", last_name="User"),
        User(email="support@sks.com", role_id=roles["customer_service"].id, first_name="Support", last_name="Agent"),
        User(email="fulfill@sks.com", role_id=roles["fulfillment"].id, first_name="Fulfill", last_name="Team"),
        User(email="demo2@sks.com", role_id=roles["user"].id, first_name="Demo", last_name="Two")
    ]
    passwords = ["admin123", "password", "support123", "shipit123", "password"]
    for u, pw in zip(users, passwords):
        u.set_password(pw)
    db.session.add_all(users)
    db.session.commit()

def seed_products():
    print("🛍️ Seeding products...")
    products = [
        Product(
            name="Sun-Kissed Beach Tee",
            sku="SK-TEE-001",
            description="A comfy, lightweight t-shirt with a bright Florida sun design.",
            image_url=None,
            category="T-Shirts",
            stock=50,
            is_active=True
        ),
        Product(
            name="Southern Charm Towel",
            sku="SC-TOWEL-002",
            description="Plush beach towel with a tropical floral print.",
            image_url=None,
            category="Beach Towels",
            stock=30,
            is_active=True
        ),
        Product(
            name="Gulf Breeze Tank",
            sku="GB-TANK-003",
            description="Relaxed fit tank perfect for beach days.",
            image_url=None,
            category="Tank Tops",
            stock=20,
            is_active=True
        )
    ]
    db.session.bulk_save_objects(products)
    db.session.commit()

def seed_variants_and_inventory():
    print("📦 Seeding product variants and inventory logs...")
    admin = User.query.filter_by(email="admin@sks.com").first()
    for product in Product.query.all():
        variants = [
            ProductVariant(
                product_id=product.id,
                sku=f"{product.id}-S-WHT",
                size="S",
                color="White",
                quantity=10,
                price=24.99,
                discount_price=19.99,
                max_per_customer=5,
                is_active=True
            ),
            ProductVariant(
                product_id=product.id,
                sku=f"{product.id}-M-BLU",
                size="M",
                color="Blue",
                quantity=3,
                price=24.99,
                discount_price=None,
                max_per_customer=2,
                is_active=True
            )
        ]
        db.session.add_all(variants)
        db.session.flush()

        for variant in variants:
            log = InventoryLog(
                product_variant_id=variant.id,
                admin_id=admin.id,
                change_type="seeded",
                quantity_before=0,
                quantity_after=variant.quantity,
                reason="Initial seed"
            )
            db.session.add(log)
    db.session.commit()

def seed_orders():
    print("📬 Seeding orders and items...")
    user = User.query.filter_by(email="demo@sks.com").first()
    variants = ProductVariant.query.limit(4).all()

    order = Order(
        order_number=Order.generate_order_number(),
        user_id=user.id,
        status="paid",
        total=sum([v.price for v in variants])
    )
    db.session.add(order)
    db.session.flush()

    shipping = ShippingAddress(
        order_id=order.id,
        full_name="Danica Murphy",
        street="123 Test Blvd",
        city="Orlando",
        state="FL",
        zip_code="32801",
        country="USA"
    )
    billing = BillingAddress(
        order_id=order.id,
        full_name="Danica Murphy",
        street="123 Test Blvd",
        city="Orlando",
        state="FL",
        zip_code="32801",
        country="USA"
    )

    db.session.add_all([shipping, billing])
    db.session.flush()

    for v in variants:
        item = OrderItem(
            order_id=order.id,
            product_id=v.product_id,
            product_variant_id=v.id,
            quantity=1,
            price=v.price,
            status="paid"  # ✅ Required
        )
        db.session.add(item)

    db.session.commit()

def seed_additional_order():
    print("📦 Seeding additional test order with qty=3...")
    user = User.query.filter_by(email="demo2@sks.com").first()
    variant = ProductVariant.query.first()

    order = Order(
        order_number=Order.generate_order_number(),
        user_id=user.id,
        status="paid",
        total=variant.price * 3
    )
    db.session.add(order)
    db.session.flush()

    shipping = ShippingAddress(
        order_id=order.id,
        full_name="Alex Morgan",
        street="456 Palm St",
        city="Clearwater",
        state="FL",
        zip_code="33755",
        country="USA"
    )
    billing = BillingAddress(
        order_id=order.id,
        full_name="Alex Morgan",
        street="456 Palm St",
        city="Clearwater",
        state="FL",
        zip_code="33755",
        country="USA"
    )
    db.session.add_all([shipping, billing])
    db.session.flush()

    db.session.add(OrderItem(
        order_id=order.id,
        product_id=variant.product_id,
        product_variant_id=variant.id,
        quantity=3,
        price=variant.price,
        status="paid"
    ))

    db.session.commit()

def seed_reviews():
    print("📝 Seeding reviews...")
    demo = User.query.filter_by(email="demo@sks.com").first()
    product = Product.query.first()
    reviews = [
        Review(user_id=demo.id, product_id=product.id, rating=5, comment="🔥🔥🔥", approved=True),
        Review(user_id=demo.id, product_id=product.id, rating=3, comment="Cute but small", approved=False)
    ]
    db.session.bulk_save_objects(reviews)
    db.session.commit()

def seed_blog():
    print("📓 Seeding blog posts...")
    posts = [
        BlogPost(title="Sun-Kissed Style Tips", content="Live your best Florida life ☀️"),
        BlogPost(title="Top Poolside Picks", content="From floppy hats to floaties 🏖️")
    ]
    db.session.bulk_save_objects(posts)
    db.session.commit()

def run_seed(mode="dev"):
    with app.app_context():
        clear_db()
        seed_roles()
        seed_users()
        seed_products()
        seed_variants_and_inventory()
        # seed_orders()
        # seed_reviews()
        seed_blog()
        # seed_returns()
        # seed_additional_order()
        print(f"✅ Seeding complete in `{mode}` mode.")

def seed_returns():
    print("↩️ Seeding returns...")
    from app.models.returns import Return
    now = datetime.utcnow()
    demo = User.query.filter_by(email="demo@sks.com").first()
    order_item = OrderItem.query.first()

    returns = [
        Return(order_item_id=order_item.id, user_id=demo.id, reason="Too small", quantity=1, refund_amount=19.99, status="Requested"),
        Return(order_item_id=order_item.id, user_id=demo.id, reason="Wrong color", quantity=1, refund_amount=24.99, status="Received", received_at=now),
        Return(order_item_id=order_item.id, user_id=demo.id, reason="Changed mind", quantity=1, refund_amount=24.99, status="Denied", processed_at=now),
        Return(order_item_id=order_item.id, user_id=demo.id, reason="Item damaged", quantity=1, refund_amount=24.99, status="Refunded", processed_at=now)
    ]

    for r in returns:
        r.rma_number = Return.generate_rma_number()
        r.created_at = now
        db.session.add(r)

    db.session.commit()

if __name__ == "__main__":
    mode = os.getenv("SEED_MODE", "dev")
    run_seed(mode)
