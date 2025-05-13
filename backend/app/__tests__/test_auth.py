import uuid
from app.models.user import User
from app.models.role import Role
from app.extensions import db
from flask_jwt_extended import create_access_token

# === Test: Register New User ===
def test_register_user(client, app):
    with app.app_context():
        if not Role.query.filter_by(name="user").first():
            db.session.add(Role(name="user"))
            db.session.commit()

    payload = {
        "email": f"user_{uuid.uuid4().hex[:6]}@test.com",
        "password": "testpass123",
        "first_name": "Test",
        "last_name": "User"
    }
    res = client.post("/api/register", json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert "token" in data
    assert data["user"]["email"] == payload["email"]

# === Test: Login Existing User ===
def test_login_user(client, app):
    with app.app_context():
        role = Role.query.filter_by(name="user").first()
        user = User(
            email="login_test@test.com",
            first_name="Login",
            last_name="User",
            role_id=role.id
        )
        user.set_password("securepass")
        db.session.add(user)
        db.session.commit()

    res = client.post("/api/login", json={
        "email": "login_test@test.com",
        "password": "securepass"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["email"] == "login_test@test.com"
    assert "token" in data

# === Test: Get Authenticated User Info ===
def test_get_current_user_info(client, app):
    with app.app_context():
        role = Role.query.filter_by(name="user").first()
        user = User(
            email="me_test@test.com",
            first_name="Me",
            last_name="User",
            role_id=role.id
        )
        user.set_password("mypassword")
        db.session.add(user)
        db.session.commit()
        token = user.generate_token()

    res = client.get("/api/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["email"] == "me_test@test.com"
    assert data["first_name"] == "Me"
    assert data["role"] == "user"

# === Test: Update Profile ===
def test_update_profile(client, app):
    with app.app_context():
        role = Role.query.filter_by(name="user").first()
        user = User(
            email="update_test@test.com",
            first_name="Old",
            last_name="Name",
            role_id=role.id
        )
        user.set_password("changeme")
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=str(user.id), additional_claims={"role": "user"})

    res = client.patch("/api/profile", json={
        "current_password": "changeme",
        "first_name": "New",
        "last_name": "Name",
        "email": "updated@test.com",
        "password": "newpass456"
    }, headers={"Authorization": f"Bearer {token}"})

    print("🔍 PATCH Response:", res.status_code, res.get_json())

    assert res.status_code == 200
    data = res.get_json()
    assert data["first_name"] == "New"
    assert data["last_name"] == "Name"
    assert data["email"] == "updated@test.com"

# === Test: Full Profile with Orders ===
def test_get_full_profile(client, app):
    with app.app_context():
        role = Role.query.filter_by(name="user").first()
        user = User(
            email="fullprofile@test.com",
            first_name="Full",
            last_name="Profile",
            role_id=role.id
        )
        user.set_password("fullpass")
        db.session.add(user)
        db.session.commit()
        token = user.generate_token()

    res = client.get("/api/profile/full", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["email"] == "fullprofile@test.com"
    assert isinstance(data["orders"], list)
