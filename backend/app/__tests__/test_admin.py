import pytest
from app.extensions import db
from shared_test_helpers import create_admin_user_and_token, create_product_and_variant
from app.models.product_variant import ProductVariant

# === Admin: Low Stock Alerts ===
def test_low_stock_alert(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
        product, _ = create_product_and_variant()
        variant = ProductVariant(sku="TEST123", product_id=product.id, quantity=2, price=9.99)
        db.session.add(variant)
        db.session.commit()

        res = client.get("/api/admin/alerts/low-stock", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.get_json()
        assert any(v["sku"] == "TEST123" for v in data)

# === Admin: List Users ===
def test_list_users(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
    res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "users" in res.get_json()

# === Admin: Top Products Analytics ===
def test_top_products(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
    res = client.get("/api/admin/analytics/top-products", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

# === Admin: Top Customers ===
def test_top_customers(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
    res = client.get("/api/admin/analytics/top-customers", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

# === Admin: Return Analytics ===
def test_return_analytics(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
    res = client.get("/api/admin/analytics/returns", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

# === Admin: Fulfillment Orders ===
def test_get_fulfillment_orders(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
    res = client.get("/api/admin/fulfillment", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

# === Admin: All Orders Report ===
def test_all_orders_report(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
    res = client.get("/api/admin/analytics/orders", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200