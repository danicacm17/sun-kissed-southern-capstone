import requests
import os
import hashlib

KD100_API_KEY = os.getenv("KD100_API_KEY")
KD100_SECRET = os.getenv("KD100_SECRET")

def generate_signature(api_key, secret):
    # This might change depending on KD100's real HMAC rules
    data = api_key + secret
    return hashlib.md5(data.encode()).hexdigest().upper()

def create_tracking_number(order):
    tracking_number = f"SKS{order.id:06d}"

    payload = {
        "area_show": 1,
        "carrier_id": "usps",
        "phone": "",
        "ship_from": "",
        "ship_to": "",
        "tracking_number": tracking_number,
        "webhook_url": "http://www.kd100.com/console/debug/callback/sandbox"
    }

    headers = {
        "Content-Type": "application/json",
        "API-Key": KD100_API_KEY,
        "signature": generate_signature(KD100_API_KEY, KD100_SECRET)
    }

    try:
        res = requests.post(
            "https://app.kd100.com/console/debug/sandbox/create",
            json=payload,
            headers=headers
        )
        print("KD100 response:", res.text)

        if res.status_code == 200:
            return tracking_number  # or parse if needed
    except Exception as e:
        print("KD100 error:", e)

    return None
