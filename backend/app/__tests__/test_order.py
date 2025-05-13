from uuid import uuid4
from decimal import Decimal
from app.extensions import db
from app.models.order import Order, OrderItem
from app.models.address import ShippingAddress, BillingAddress
from app.__tests__.shared_test_helpers import (
    create_admin_user_and_token,
    create_product_and_variant
)


def create_order_with_item(status="paid"):
    """Helper: Create a single order item and return (item, token)."""
    user, token = create_admin_user_and_token()
    product, variant = create_product_and_variant()

    order = Order(
        user_id=user.id,
        total=Decimal("50.00"),
        status=status,
        ref_num="DEV-MOCK-123",
        order_number=f"SKS{uuid4().hex[:7].upper()}"
    )
    db.session.add(order)
    db.session.flush()

    shipping = ShippingAddress(
        order_id=order.id,
        full_name="Customer",
        street="123 Lane",
        city="Tampa",
        state="FL",
        zip_code="33602"
    )
    billing = BillingAddress(
        order_id=order.id,
        full_name="Customer",
        street="123 Lane",
        city="Tampa",
        state="FL",
        zip_code="33602"
    )
    db.session.add_all([shipping, billing])
    db.session.flush()

    order.shipping_address_id = shipping.id
    order.billing_address_id = billing.id

    item = OrderItem(
        order_id=order.id,
        product_id=product.id,
        product_variant_id=variant.id,
        quantity=2,
        price=Decimal("25.00"),
        status=status
    )
    db.session.add(item)
    db.session.commit()

    return item, token


# === Fulfill Item Test ===
def test_fulfill_item(client, app):
    item, token = create_order_with_item(status="paid")
    res = client.patch(
        f"/api/admin/orders/item/{item.id}/fulfill",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert "fulfilled" in res.get_json()["message"]


# === Backorder Item Test ===
def test_backorder_item(client, app):
    item, token = create_order_with_item(status="paid")
    res = client.patch(
        f"/api/admin/orders/item/{item.id}/backorder",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert "backordered" in res.get_json()["message"]


# === Update Tracking Test ===
def test_update_tracking(client, app):
    item, token = create_order_with_item(status="fulfilled")
    res = client.patch(
        f"/api/admin/orders/{item.id}/tracking",
        json={"tracking_number": "TRACK123"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert "updated" in res.get_json()["message"]
