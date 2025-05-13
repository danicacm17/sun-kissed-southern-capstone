from app.extensions import db, bcrypt
from flask_jwt_extended import create_access_token
from datetime import datetime

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    role = db.relationship("Role", back_populates="users")
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False)
    favorites = db.relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    

    def set_password(self, password: str) -> None:
        """Hashes and sets the user's password."""
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password: str) -> bool:
        """Checks if the provided password matches the stored hash."""
        return bcrypt.check_password_hash(self.password_hash, password)

    def generate_token(self) -> str:
        """Generates JWT token with user ID and role name."""
        role_name = self.role.name if self.role else "user"  # fallback prevents crash
        return create_access_token(
            identity=str(self.id),
            additional_claims={"role": role_name}
        )

    @staticmethod
    def hash_password(password: str) -> str:
        """Returns hashed password — useful for seeding scripts."""
        return bcrypt.generate_password_hash(password).decode("utf-8")
