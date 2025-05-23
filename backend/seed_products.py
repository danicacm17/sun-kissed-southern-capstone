import csv
from app.extensions import db
from app.models.product import Product

def seed_products(filepath):
    with open(filepath, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            product = Product(
                sku=row["sku"].strip(),
                name=row["name"].strip(),
                description=row["description"].strip(),
                category=row["category"].strip(),
                image_url=row["image_url"].strip(),
                is_active=row["is_active"].strip().lower() == "true"
            )
            db.session.add(product)
        db.session.commit()
        print("✅ Products seeded.")
