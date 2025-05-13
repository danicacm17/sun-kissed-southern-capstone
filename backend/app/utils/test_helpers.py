import pytest

def auth_header(token):
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_headers(admin_token):
    return auth_header(admin_token)

@pytest.fixture
def demo_headers(demo_token):
    return auth_header(demo_token)
