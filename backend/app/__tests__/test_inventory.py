import uuid
from app.extensions import db
from app.models.role import Role
from app.models.user import User
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.inventory_log import InventoryLog
from flask_jwt_extended import create_access_token

# === Helper: Create admin user + token ===
def create_admin_user_and_token(app):
    with app.app_context():
        role = Role.query.filter_by(name="admin").first()
        if not role:
            role = Role(name="admin")
            db.session.add(role)
            db.session.commit()

        user = User(
            email=f"admin_{uuid.uuid4().hex[:6]}@test.com",
            first_name="Inventory",
            last_name="Admin",
            role_id=role.id
        )
        user.set_password("adminpass")
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id), additional_claims={"role": "admin"})
        return user, token

# === Helper: Create product variant and return ID ===
def create_variant_id(app):
    with app.app_context():
        product = Product(
            name="Inventory Product",
            sku=f"SKU-{uuid.uuid4().hex[:6]}",
            category="Totes",
            stock=10
        )
        db.session.add(product)
        db.session.flush()

        variant = ProductVariant(
            product_id=product.id,
            sku=f"VAR-{uuid.uuid4().hex[:6]}",
            size="M",
            color="Red",
            price=20.0,
            quantity=10
        )
        db.session.add(variant)
        db.session.commit()
        return variant.id

# === Test: List inventory logs ===
def test_list_inventory_logs(client, app):
    admin, token = create_admin_user_and_token(app)
    variant_id = create_variant_id(app)

    with app.app_context():
        log = InventoryLog(
            product_variant_id=variant_id,
            admin_id=admin.id,
            change_type="adjustment",
            quantity_before=5,
            quantity_after=10,
            reason="Restock"
        )
        db.session.add(log)
        db.session.commit()

    res = client.get("/api/admin/inventory-logs", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)
    assert res.get_json()[0]["variant_id"] == variant_id

# === Test: Create inventory log ===
def test_create_inventory_log(client, app):
    admin, token = create_admin_user_and_token(app)
    variant_id = create_variant_id(app)

    payload = {
        "variant_id": variant_id,
        "change_type": "adjustment",
        "quantity_before": 3,
        "quantity_after": 8,
        "reason": "Manual adjustment"
    }

    res = client.post("/api/admin/inventory-logs", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    assert res.get_json()["log"]["variant_id"] == variant_id

# === Test: Missing fields should fail ===
def test_create_inventory_log_missing_fields(client, app):
    _, token = create_admin_user_and_token(app)

    res = client.post("/api/admin/inventory-logs", json={}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400
    assert "error" in res.get_json()
