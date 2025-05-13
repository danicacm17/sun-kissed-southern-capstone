import uuid
from app.models.user import User
from app.models.role import Role
from app.models.product import Product
from app.models.favorite import Favorite
from app.extensions import db
from flask_jwt_extended import create_access_token

# === Helper: Create a demo user and JWT ===
def create_demo_user_and_token(app):
    with app.app_context():
        role = Role.query.filter_by(name="user").first()
        if not role:
            role = Role(name="user")
            db.session.add(role)
            db.session.commit()

        user = User(
            email=f"user_{uuid.uuid4().hex[:6]}@test.com",
            first_name="Demo",
            last_name="User",
            role_id=role.id
        )
        user.set_password("testpass")
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=str(user.id), additional_claims={"role": "user"})
        return user, token

# === Helper: Create a product and return its ID ===
def create_product_id(app):
    with app.app_context():
        product = Product(
            name="Favorite Item",
            sku=f"SKU-{uuid.uuid4().hex[:6]}",
            description="A test item for favorites",
            category="Accessories",
            stock=10,
            is_active=True
        )
        db.session.add(product)
        db.session.commit()
        return product.id

# === Test: Add product to favorites ===
def test_add_favorite(client, app):
    user, token = create_demo_user_and_token(app)
    product_id = create_product_id(app)

    res = client.post(f"/api/favorites/{product_id}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    assert res.get_json()["message"] == "Product added to favorites"

# === Test: Get all favorites for the user ===
def test_get_favorites(client, app):
    user, token = create_demo_user_and_token(app)
    product_id = create_product_id(app)

    with app.app_context():
        db.session.add(Favorite(user_id=user.id, product_id=product_id))
        db.session.commit()

    res = client.get("/api/favorites", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert data[0]["product_id"] == product_id

# === Test: Remove product from favorites ===
def test_remove_favorite(client, app):
    user, token = create_demo_user_and_token(app)
    product_id = create_product_id(app)

    with app.app_context():
        db.session.add(Favorite(user_id=user.id, product_id=product_id))
        db.session.commit()

    res = client.delete(f"/api/favorites/{product_id}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["message"] == "Favorite removed"
