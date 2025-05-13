import pytest
from app.models.returns import Return
from app.extensions import db
from app.__tests__.shared_test_helpers import create_order_with_items, create_admin_user_and_token

def test_request_return(client, app):
    with app.app_context():
        order, _ = create_order_with_items()
        item = order.items[0]
        admin, token = create_admin_user_and_token()

        payload = {
            "order_item_id": item.id,
            "reason": "Wrong size"
        }

        res = client.post(
            "/api/returns",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 201
        data = res.get_json()
        assert "return_id" in data
        assert "rma_number" in data

def test_list_returns(client, app):
    with app.app_context():
        order, _ = create_order_with_items()
        item = order.items[0]
        admin, token = create_admin_user_and_token()
        ret = Return(
            order_item_id=item.id,
            user_id=order.user_id,
            reason="Too small",
            quantity=1,
            refund_amount=item.price,
            rma_number=Return.generate_rma_number()
        )
        db.session.add(ret)
        db.session.commit()

        res = client.get("/api/admin/returns", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert isinstance(res.get_json(), list)

def test_reopen_denied_return(client, app):
    with app.app_context():
        order, _ = create_order_with_items()
        item = order.items[0]
        admin, token = create_admin_user_and_token()
        ret = Return(
            order_item_id=item.id,
            user_id=order.user_id,
            reason="No longer needed",
            quantity=1,
            refund_amount=item.price,
            rma_number=Return.generate_rma_number(),
            status="Denied"
        )
        db.session.add(ret)
        db.session.commit()
        return_id = ret.id

    res = client.patch(
        f"/api/returns/{return_id}/reopen",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert res.get_json()["message"] == "Return request reopened"
