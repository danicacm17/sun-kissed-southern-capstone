import os

def send_cardknox_payment(amount, card_info):
    """Simulates or sends a payment to Cardknox."""
    if os.getenv("CARDKNOX_ENV") == "sandbox":
        print(f"🧪 [Sandbox] Simulating Cardknox payment of ${amount}")
        return {
            "xResult": "A",
            "xRefNum": "SIMULATED123456",
            "xAmount": str(amount),
            "xType": "SALE"
        }

    raise NotImplementedError("Cardknox payment not implemented for production.")

def send_cardknox_refund(amount, card_info, ref_num):
    """Simulates or sends a refund to Cardknox using original ref_num."""
    if os.getenv("CARDKNOX_ENV") == "sandbox":
        print(f"🧪 [Sandbox] Simulating Cardknox refund of ${amount} for ref {ref_num}")
        return {
            "xResult": "A",
            "xRefNum": ref_num,
            "xAmount": str(amount),
            "xType": "CREDIT"
        }

    raise NotImplementedError("Cardknox refund not implemented for production.")
