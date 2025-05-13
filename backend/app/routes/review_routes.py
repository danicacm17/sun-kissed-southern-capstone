"""
Review routes for submitting, moderating, and displaying product reviews.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from werkzeug.http import parse_date
from sqlalchemy import func
from sqlalchemy.orm import joinedload
from datetime import datetime
from pytz import timezone

from app.extensions import db
from app.models.review import Review
from app.models.user import User
from app.models.product import Product
from app.utils.jwt_helpers import extract_user_info
from app.utils.auth import role_required

review_bp = Blueprint("reviews", __name__)
eastern = timezone("US/Eastern")

# === Helper: Serialize review with user and product context ===
def serialize_review_with_user(review):
    user = review.user
    product = review.product
    return {
        "id": review.id,
        "product_id": review.product_id,
        "rating": review.rating,
        "comment": review.comment,
        "approved": review.approved,
        "created_at": review.created_at.isoformat(),
        "user_first_name": user.first_name,
        "user_last_name": user.last_name,
        "product_name": product.name if product else None,
        "product_image_url": product.image_url if product else None
    }

# === POST /api/reviews ===
@review_bp.route("/api/reviews", methods=["POST"])
@jwt_required()
def create_review():
    user_id, _ = extract_user_info()
    data = request.get_json() or {}

    product_id = data.get("product_id")
    rating = data.get("rating")
    comment = data.get("comment", "")

    # 🛑 Add this safety check:
    if not isinstance(product_id, int) or not isinstance(rating, int):
        return jsonify({"error": "product_id and rating must be integers"}), 400

    # 🛑 Check that product exists
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Invalid product_id"}), 404

    review = Review(
        user_id=user_id,
        product_id=product_id,
        rating=rating,
        comment=comment
    )
    db.session.add(review)
    db.session.commit()

    return jsonify(serialize_review_with_user(review)), 201

# === GET /api/products/<product_id>/reviews ===
# Public route to list approved reviews for a product
@review_bp.route("/api/products/<int:product_id>/reviews", methods=["GET"])
def get_product_reviews(product_id):
    """
    Get approved reviews for a product (public route).
    Supports filtering by rating, user, sort, pagination.
    """
    query = Review.query.filter_by(product_id=product_id, approved=True).join(User)

    rating = request.args.get("rating", type=int)
    user = request.args.get("user")
    sort = request.args.get("sort", "most_recent")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))
    offset = (page - 1) * limit

    if rating:
        query = query.filter(Review.rating == rating)
    if user:
        query = query.filter(User.email.ilike(f"%{user}%"))

    sort_map = {
        "most_recent": Review.created_at.desc(),
        "highest_rating": Review.rating.desc(),
        "lowest_rating": Review.rating.asc()
    }
    query = query.order_by(sort_map.get(sort, Review.created_at.desc()))

    total_reviews = query.count()
    reviews = query.offset(offset).limit(limit).all()

    return jsonify({
        "page": page,
        "limit": limit,
        "total_reviews": total_reviews,
        "total_pages": (total_reviews + limit - 1) // limit,
        "items": [serialize_review_with_user(r) for r in reviews]
    }), 200

# === GET /api/reviews ===
# Filtered review listing (public or admin usage)
@review_bp.route("/api/reviews", methods=["GET"])
def get_filtered_reviews():
    """
    Return all reviews with optional filters.
    Used on public pages and admin tools.
    """
    product_id = request.args.get("product_id", type=int)
    min_rating = request.args.get("min_rating", type=int)
    approved = request.args.get("approved")

    query = Review.query.join(User)

    if product_id:
        query = query.filter(Review.product_id == product_id)
    if min_rating is not None:
        query = query.filter(Review.rating >= min_rating)
    if approved is not None:
        query = query.filter(Review.approved == (approved.lower() == "true"))

    query = query.order_by(Review.created_at.desc())
    return jsonify([serialize_review_with_user(r) for r in query.all()]), 200

# === GET /api/admin/reviews/unapproved ===
# Admin route to view all unapproved reviews
@review_bp.route("/api/admin/reviews/unapproved", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_unapproved_reviews():
    """
    Admin route to get all unapproved reviews with filters and pagination.
    """
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))
    offset = (page - 1) * limit

    rating = request.args.get("rating", type=int)
    user = request.args.get("user")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    sort = request.args.get("sort")

    query = Review.query.filter_by(approved=False).join(User)

    if rating:
        query = query.filter(Review.rating == rating)
    if user:
        query = query.filter(User.email.ilike(f"%{user}%"))
    if start_date:
        start = parse_date(start_date)
        if start:
            query = query.filter(Review.created_at >= start)
    if end_date:
        end = parse_date(end_date)
        if end:
            query = query.filter(Review.created_at <= end)

    sort_map = {
        "most_recent": Review.created_at.desc(),
        "oldest": Review.created_at.asc(),
        "highest_rating": Review.rating.desc(),
        "lowest_rating": Review.rating.asc()
    }
    query = query.order_by(sort_map.get(sort, Review.created_at.desc()))

    total = query.count()
    reviews = query.offset(offset).limit(limit).all()

    return jsonify({
        "reviews": [serialize_review_with_user(r) for r in reviews],
        "page": page,
        "limit": limit,
        "total_unapproved": total,
        "total_pages": (total + limit - 1) // limit
    }), 200

# === PATCH /api/admin/reviews/<id> ===
# Admin can approve or deny a review
@review_bp.route("/api/admin/reviews/<int:review_id>", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def moderate_review(review_id):
    """
    Admin route to approve or deny a review.
    If denied, the review is deleted.
    """
    review = Review.query.get_or_404(review_id)
    status = request.get_json().get("status")

    if status == "approve":
        review.approved = True
    elif status == "deny":
        db.session.delete(review)
        db.session.commit()
        return jsonify({"message": "Review denied and removed"}), 200
    else:
        return jsonify({"error": "Invalid status"}), 400

    db.session.commit()
    return jsonify({"message": "Review approved"}), 200

# === PATCH /api/reviews/<id> ===
@review_bp.route("/api/reviews/<int:review_id>", methods=["PATCH"])
@jwt_required()
def edit_review(review_id):
    """
    Authenticated user can edit their own review.
    """
    user_id, _ = extract_user_info()
    review = Review.query.get_or_404(review_id)

    # 🔍 Debug prints (optional during testing)
    print("EDIT: token user_id =", user_id)
    print("EDIT: review.user_id =", review.user_id)

    if int(review.user_id) != int(user_id):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json() or {}
    rating = data.get("rating")
    comment = data.get("comment")

    # ✅ Optional: validate rating type
    if rating is not None and not isinstance(rating, int):
        return jsonify({"error": "Rating must be an integer"}), 422

    review.rating = rating if rating is not None else review.rating
    review.comment = comment if comment is not None else review.comment

    db.session.commit()
    return jsonify({"message": "Review updated"}), 200


# === DELETE /api/reviews/<id> ===
@review_bp.route("/api/reviews/<int:review_id>", methods=["DELETE"])
@jwt_required()
def delete_review(review_id):
    """
    Authenticated user can delete their own review.
    """
    user_id, _ = extract_user_info()
    review = Review.query.get_or_404(review_id)

    # 🔍 Debug prints (optional)
    print("DELETE: token user_id =", user_id)
    print("DELETE: review.user_id =", review.user_id)

    if int(review.user_id) != int(user_id):
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(review)
    db.session.commit()
    return jsonify({"message": "Review deleted"}), 200

