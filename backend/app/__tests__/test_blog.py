import uuid
from app.extensions import db
from app.models.blog import BlogPost
from app.models.role import Role
from app.models.user import User
from flask_jwt_extended import create_access_token

# === Helper: Create admin token ===
def create_admin_token(app):
    with app.app_context():
        role = Role.query.filter_by(name="admin").first()
        if not role:
            role = Role(name="admin")
            db.session.add(role)
            db.session.commit()
        user = User(
            email=f"admin_{uuid.uuid4().hex[:6]}@test.com",
            first_name="Admin",
            last_name="User",
            role_id=role.id
        )
        user.set_password("adminpass")
        db.session.add(user)
        db.session.commit()
        return create_access_token(identity=str(user.id), additional_claims={"role": "admin"})

# === Test: Get all blog posts with weather ===
def test_get_blog_posts(client, app):
    with app.app_context():
        post = BlogPost(title="Welcome", content="Hello world!")
        db.session.add(post)
        db.session.commit()

    res = client.get("/api/blog")
    assert res.status_code == 200
    data = res.get_json()
    assert "weather" in data
    assert any(p["title"] == "Welcome" for p in data["posts"])

# === Test: Get single blog post ===
def test_get_single_blog_post(client, app):
    with app.app_context():
        post = BlogPost(title="Solo", content="One entry")
        db.session.add(post)
        db.session.commit()
        post_id = post.id

    res = client.get(f"/api/blog/{post_id}")
    assert res.status_code == 200
    assert res.get_json()["title"] == "Solo"

# === Test: Create blog post (admin only) ===
def test_create_blog_post(client, app):
    token = create_admin_token(app)
    res = client.post("/api/blog", json={
        "title": "Admin Post",
        "content": "Secret post"
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    assert "id" in res.get_json()

# === Test: Update blog post ===
def test_update_blog_post(client, app):
    token = create_admin_token(app)
    with app.app_context():
        post = BlogPost(title="Old Title", content="Old content")
        db.session.add(post)
        db.session.commit()
        post_id = post.id

    res = client.patch(f"/api/blog/{post_id}", json={
        "title": "Updated Title",
        "content": "Updated content"
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["message"] == "Blog post updated"

# === Test: Delete blog post ===
def test_delete_blog_post(client, app):
    token = create_admin_token(app)
    with app.app_context():
        post = BlogPost(title="To Delete", content="Soon gone")
        db.session.add(post)
        db.session.commit()
        post_id = post.id

    res = client.delete(f"/api/blog/{post_id}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["message"] == "Blog post deleted"
