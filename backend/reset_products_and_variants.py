import os
from dotenv import load_dotenv

# Load env vars before app initialization
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("🔁 Resetting product-related tables...")

    try:
        db.session.execute(text("""
            TRUNCATE TABLE
                inventory_logs,
                sale_variant,
                product_variants,
                products
            RESTART IDENTITY CASCADE;
        """))
        db.session.commit()
        print("✅ All product-related tables wiped and sequences reset.")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error during reset: {e}")
