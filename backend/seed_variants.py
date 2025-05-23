import csv
import csv
from app.extensions import db
from app.models.product import Product
from app.models.product_variant import ProductVariant

def to_float(value):
    try:
        return float(value.strip()) if value and value.strip() else None
    except:
        return None

def to_int(value):
    try:
        return int(value.strip()) if value and value.strip() else 0
    except:
        return 0

def seed_variants(filepath):
    with open(filepath, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for i, row in enumerate(reader, start=2):  # line 2 = first row after header
            try:
                if not row["product_sku"] or not row["variant_sku"]:
                    print(f"⛔ Skipping blank or malformed row {i}")
                    continue

                sku = row["product_sku"].strip()
                product = Product.query.filter_by(sku=sku).first()
                if not product:
                    print(f"⚠️  Product not found for SKU '{sku}' on row {i}")
                    continue

                variant = ProductVariant(
                    product_id=product.id,
                    sku=row["variant_sku"].strip(),
                    color=row["color"].strip(),
                    size=row["size"].strip(),
                    price=to_float(row["price"]) or 0.0,
                    discount_price=to_float(row["discount_price"]),
                    quantity=to_int(row["quantity"]),
                    max_per_customer=to_int(row["max_per_customer"]),
                    image_url=row["variant_image_url"].strip(),
                    is_active=True
                )
                db.session.add(variant)

            except Exception as e:
                print(f"❌ Error on row {i}: {e}")

        db.session.commit()
        print("✅ Variants seeded successfully.")
