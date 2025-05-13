"""
Routes for public and admin blog post access. Includes weather banner on fetch.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.blog import BlogPost
from app.utils.auth import role_required
from app.services.weather import get_florida_weather

blog_bp = Blueprint("blog", __name__)

# === Get All Blog Posts with Weather Banner ===
@blog_bp.route("/api/blog", methods=["GET"])
def get_blog_posts():
    """Public endpoint to get all blog posts with a Florida weather banner."""
    posts = BlogPost.query.order_by(BlogPost.created_at.desc()).all()
    weather = get_florida_weather()
    return jsonify({
        "weather": weather,
        "posts": [post.to_dict() for post in posts]
    }), 200

# === Get a Single Blog Post ===
@blog_bp.route("/api/blog/<int:id>", methods=["GET"])
def get_blog_post(id):
    """Fetch a single blog post by ID."""
    post = BlogPost.query.get_or_404(id)
    return jsonify(post.to_dict()), 200

# === Create a New Blog Post (Admin Only) ===
@blog_bp.route("/api/blog", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_blog_post():
    """Create a new blog post (admin only)."""
    data = request.get_json()
    title = data.get("title")
    content = data.get("content")

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    post = BlogPost(title=title, content=content)
    db.session.add(post)
    db.session.commit()

    return jsonify({"message": "Blog post created", "id": post.id}), 201

# === Update Blog Post (Admin Only) ===
@blog_bp.route("/api/blog/<int:id>", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def update_blog_post(id):
    """Update an existing blog post (admin only)."""
    post = BlogPost.query.get_or_404(id)
    data = request.get_json()

    post.title = data.get("title", post.title)
    post.content = data.get("content", post.content)

    db.session.commit()
    return jsonify({"message": "Blog post updated"}), 200

# === Delete Blog Post (Admin Only) ===
@blog_bp.route("/api/blog/<int:id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def delete_blog_post(id):
    """Delete a blog post by ID (admin only)."""
    post = BlogPost.query.get_or_404(id)
    db.session.delete(post)
    db.session.commit()
    return jsonify({"message": "Blog post deleted"}), 200
