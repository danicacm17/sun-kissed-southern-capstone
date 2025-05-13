# test_app_startup.py
import os
os.environ["FLASK_ENV"] = "testing"

from dotenv import load_dotenv
load_dotenv(".env.test")

from app import create_app, db

print("🚀 Attempting to create test app...")
app = create_app("test")
print("✅ App created.")

with app.app_context():
    print("🔧 Creating database tables...")
    db.create_all()
    print("✅ DB tables created successfully.")
