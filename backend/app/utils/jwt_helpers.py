from flask_jwt_extended import get_jwt_identity, get_jwt

def extract_user_info():
    identity = get_jwt_identity()
    role = get_jwt().get("role")
    
    # ✅ Fix: ensure it's extracting from a dict
    if isinstance(identity, dict) and "id" in identity:
        return identity["id"], role
    return identity, role  # fallback for legacy tokens
