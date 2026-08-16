import os
import sys
import shutil
import tempfile
import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from fastapi.testclient import TestClient

# Create a temporary database and upload directory for testing
test_dir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(test_dir, 'test.db')}"
os.environ["UPLOAD_DIR"] = os.path.join(test_dir, "uploads")
os.environ["STORAGE_DIR"] = os.path.join(test_dir, "storage")
os.environ["ENVIRONMENT"] = "testing"
os.environ["DEMO_MODE"] = "true"

from app.main import app
from app.core.database import Base, engine

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    shutil.rmtree(test_dir, ignore_errors=True)

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_tokens(client):
    # Register user or login if exists
    r_user = client.post("/api/auth/register", json={
        "email": "testuser@example.com",
        "password": "password123",
        "full_name": "Test User"
    })
    if r_user.status_code == 409:
        r_user = client.post("/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "password123"
        })
    user_token = r_user.json()["token"]

    # Guest token
    r_guest = client.post("/api/auth/guest")
    guest_token = r_guest.json()["token"]

    return {
        "user": user_token,
        "guest": guest_token,
    }
