import pytest
from app.extensions import db
from app.models.product_variant import ProductVariant
from shared_test_helpers import create_admin_user_and_token, create_product_and_variant

# === Public: List active variants for a product ===
def test_list_active_variants(client, app):
    with app.app_context():
        product, _ = create_product_and_variant()
        product_id = product.id

        res = client.get(f"/api/products/{product_id}/variants")
        assert res.status_code == 200
        assert len(res.get_json()) == 1

# === Admin: List all variants for a product ===
def test_admin_list_all_variants(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
        product, _ = create_product_and_variant()
        product_id = product.id

        res = client.get(f"/api/admin/products/{product_id}/variants",
                         headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert len(res.get_json()) == 1

# === Admin: Create new variant ===
def test_create_variant(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
        product, _ = create_product_and_variant()
        product_id = product.id

    res = client.post(f"/api/admin/products/{product_id}/variants", json={
        "sku": "NEWVAR123",
        "size": "L",
        "color": "Red",
        "quantity": 10,
        "price": 29.99,
        "discount_price": 24.99,
        "image_url": "http://example.com/image.jpg",
        "max_per_customer": 2
    }, headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 201
    data = res.get_json()
    assert data["sku"] == "NEWVAR123"
    assert data["quantity"] == 10

# === Admin: Create variant with missing required fields ===
def test_create_variant_missing_required(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
        product, _ = create_product_and_variant()
        product_id = product.id

    res = client.post(f"/api/admin/products/{product_id}/variants", json={
        "size": "M",
        "color": "Blue"
    }, headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 400
    assert "Missing required fields" in res.get_json()["error"]

# === Admin: Update a variant ===
def test_update_variant(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
        product, variant = create_product_and_variant()
        variant_id = variant.id

        res = client.put(f"/api/admin/variants/{variant_id}", json={
            "price": 19.99,
            "quantity": 5
        }, headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.get_json()
        assert data["price"] == 19.99
        assert data["quantity"] == 5

# === Admin: Toggle variant enable/disable ===
def test_toggle_variant_enable_disable(client, app):
    with app.app_context():
        admin, token = create_admin_user_and_token()
        product, variant = create_product_and_variant()
        product_id = product.id
        variant_id = variant.id

        # Disable variant
        res = client.patch(f"/api/admin/products/{product_id}/variants/{variant_id}/disable",
                           headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert "disabled" in res.get_json()["message"]

        # Enable variant
        res = client.patch(f"/api/admin/products/{product_id}/variants/{variant_id}/enable",
                           headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert "enabled" in res.get_json()["message"]
