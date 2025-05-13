import pytest
from app.extensions import db
from app.models.review import Review
from shared_test_helpers import (
    create_demo_user_and_token,
    create_product_and_variant,
)

# === Create review ===
def test_create_review(client, app):
    with app.app_context():
        user, token = create_demo_user_and_token()
        product, _ = create_product_and_variant()

        res = client.post("/api/reviews", json={
            "product_id": product.id,
            "rating": 5,
            "comment": "Great product!"
        }, headers={"Authorization": f"Bearer {token}"})

        assert res.status_code == 201

# === Edit review ===
def test_edit_review(client, app):
    with app.app_context():
        user, token = create_demo_user_and_token()
        product, _ = create_product_and_variant()

        review = Review(user_id=user.id, product_id=product.id, rating=4, comment="Good")
        db.session.add(review)
        db.session.commit()

        res = client.patch(f"/api/reviews/{review.id}", json={
            "rating": 3,
            "comment": "Okay"
        }, headers={"Authorization": f"Bearer {token}"})

        assert res.status_code == 200

# === Delete review ===
def test_delete_review(client, app):
    with app.app_context():
        user, token = create_demo_user_and_token()
        product, _ = create_product_and_variant()

        review = Review(user_id=user.id, product_id=product.id, rating=4, comment="Fine")
        db.session.add(review)
        db.session.commit()

        res = client.delete(f"/api/reviews/{review.id}", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
