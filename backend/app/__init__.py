import os
from flask import Flask
from flask_cors import CORS
from app.extensions import db, migrate, jwt
from app.config import Config, TestConfig
from dotenv import load_dotenv  # ✅ Add this
load_dotenv()  # ✅ Load environment variables from .env

def create_app(config_name=None):
    from dotenv import load_dotenv
    load_dotenv()

    app = Flask(__name__)
    app.config.from_object(TestConfig if config_name == "test" else Config)

    # ✅ Ensure keys are present even if .env wasn't loaded early enough
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "test-jwt-secret")
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "test-secret")

    CORS(app, supports_credentials=True, origins=[
        "http://localhost:5173",
        "https://sun-kissed-and-southern.netlify.app"
    ])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    from app.routes import register_routes
    register_routes(app)

    return app

