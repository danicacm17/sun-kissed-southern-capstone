import os
import pytest
from dotenv import load_dotenv
from uuid import uuid4
from app import create_app, db
from app.models.user import User
from app.models.role import Role
from flask_jwt_extended import create_access_token

# Load test environment
load_dotenv(".env.test")

@pytest.fixture(scope="session")
def app():
    os.environ["FLASK_ENV"] = "test"
    app = create_app("test")
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope="function")
def client(app):
    return app.test_client()

@pytest.fixture(scope="session", autouse=True)
def seed_roles(app):
    with app.app_context():
        if not Role.query.first():
            roles = ["admin", "user", "customer_service", "fulfillment"]
            for name in roles:
                db.session.add(Role(name=name))
            db.session.commit()

@pytest.fixture(scope="function")
def admin_token(app):
    with app.app_context():
        role = Role.query.filter_by(name="admin").first()
        admin = User.query.filter_by(email="admin@sks.com").first()
        if not admin:
            admin = User(
                email="admin@sks.com",
                first_name="Admin",
                last_name="User",
                role_id=role.id
            )
            admin.set_password("admin123")
            db.session.add(admin)
            db.session.commit()
        return create_access_token(identity=admin.id, additional_claims={"role": "admin"})

@pytest.fixture(scope="function")
def demo_token(app):
    with app.app_context():
        role = Role.query.filter_by(name="user").first()
        user = User.query.filter_by(email="demo@sks.com").first()
        if not user:
            user = User(
                email="demo@sks.com",
                first_name="Demo",
                last_name="User",
                role_id=role.id
            )
            user.set_password("password123")
            db.session.add(user)
            db.session.commit()
        return create_access_token(identity=user.id, additional_claims={"role": "user"})
