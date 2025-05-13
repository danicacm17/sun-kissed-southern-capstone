import pytest
from app.extensions import db
from shared_test_helpers import create_admin_user_and_token, create_product_and_variant

# === Public: List products with filters ===
def test_list_products(client, app):
    with app.app_context():
        create_product_and_variant()
    res = client.get("/api/products")
    assert res.status_code == 200
    assert res.get_json()["total_items"] >= 1

# === Public: Get single product ===
def test_get_product(client, app):
    with app.app_context():
        product, _ = create_product_and_variant()
        product_id = product.id
    res = client.get(f"/api/products/{product_id}")
    assert res.status_code == 200
    assert res.get_json()["id"] == product_id

# === Public: Get by category slug ===
def test_get_products_by_category(client, app):
    with app.app_context():
        create_product_and_variant()
    res = client.get("/api/products/category/t-shirts")
    assert res.status_code == 200
    assert "products" in res.get_json()

# === Admin: List all products ===
def test_admin_list_products(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
        create_product_and_variant()
    res = client.get("/api/admin/products", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["total_items"] >= 1

# === Admin: Create product ===
def test_create_product(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
    res = client.post("/api/admin/products", json={
        "name": "Test Product",
        "description": "Test Description",
        "category": "T-Shirts",
        "sku": "TEST123",
        "stock": 10,
        "image_url": "http://example.com/img.jpg"
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    assert "id" in res.get_json()

# === Admin: Update product ===
def test_update_product(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
        product, _ = create_product_and_variant()
        product_id = product.id  # capture while still in session

    res = client.put(f"/api/admin/products/{product_id}", json={
        "name": "Updated Name",
        "stock": 20
    }, headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 200
    assert res.get_json()["message"] == "Product updated"

# === Admin: Disable product ===
def test_disable_product(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
        product, _ = create_product_and_variant()
        product_id = product.id

    res = client.patch(f"/api/admin/products/{product_id}/disable",
                       headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 200
    assert "disabled" in res.get_json()["message"]

# === Admin: Enable product ===
def test_enable_product(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
        product, _ = create_product_and_variant()
        product.is_active = False
        db.session.commit()
        product_id = product.id

    res = client.patch(f"/api/admin/products/{product_id}/enable",
                       headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 200
    assert "reactivated" in res.get_json()["message"]
