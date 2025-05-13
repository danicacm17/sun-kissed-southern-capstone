from app.routes.auth_routes import auth_bp
from app.routes.product_routes import product_bp
from app.routes.order_routes import order_bp
from app.routes.admin_routes import admin_bp
from app.routes.variant_routes import variant_bp
from app.routes.inventory_routes import inventory_bp
from app.routes.returns_routes import return_bp
from app.routes.review_routes import review_bp
from app.routes.favorite_routes import favorite_bp
from app.routes.blog_routes import blog_bp
from app.routes.discount_routes import discount_bp

def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(variant_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(return_bp)
    app.register_blueprint(review_bp)
    app.register_blueprint(favorite_bp)
    app.register_blueprint(blog_bp)
    app.register_blueprint(discount_bp)