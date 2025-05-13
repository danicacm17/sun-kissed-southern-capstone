from app.models.user import User
from app.extensions import db

def send_confirmation_email(user_email, order):
    """Simulated order confirmation email (prints to console)."""
    user = User.query.filter_by(email=user_email).first()
    if not user:
        print("❌ User not found for order confirmation.")
        return

    print(
        f"📧 Order confirmation email sent to {user.email}\n"
        f"Hi {user.first_name} {user.last_name},\n"
        f"Thank you for your purchase!\n"
        f"Order Number: {order.order_number}\n"
        f"Total: ${order.total:.2f}\n"
        f"Status: {order.status}\n"
    )

def send_return_email(user_email, return_obj):
    """Simulated return confirmation email (prints to console)."""
    user = User.query.filter_by(email=user_email).first()

    if not user:
        print("❌ User not found for return confirmation.")
        return

    print(
        f"📧 Return confirmation email sent to {user.email}\n"
        f"Hi {user.first_name} {user.last_name},\n"
        f"Your return has been processed.\n"
        f"Return ID: {return_obj.id}\n"
        f"Status: {return_obj.status}\n"
        f"Refunded: ${return_obj.refund_amount or 0:.2f}\n"
        f"Processed at: {return_obj.processed_at}\n"
    )
