def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "demo_mode" in data
    assert "version" in data

def test_auth_flow(client):
    # Register
    r = client.post("/api/auth/register", json={
        "email": "unique@example.com",
        "password": "securepassword123",
        "full_name": "Unique User"
    })
    assert r.status_code == 200
    data = r.json()
    assert "token" in data
    assert data["user"]["email"] == "unique@example.com"

    # Duplicate register should fail 409
    r_dup = client.post("/api/auth/register", json={
        "email": "unique@example.com",
        "password": "anotherpassword",
        "full_name": "Duplicate User"
    })
    assert r_dup.status_code == 409

    # Login correct
    r_login = client.post("/api/auth/login", json={
        "email": "unique@example.com",
        "password": "securepassword123"
    })
    assert r_login.status_code == 200
    assert "token" in r_login.json()

    # Login wrong password
    r_bad = client.post("/api/auth/login", json={
        "email": "unique@example.com",
        "password": "wrongpassword"
    })
    assert r_bad.status_code == 401

    # Me endpoint
    token = r_login.json()["token"]
    r_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r_me.status_code == 200
    assert r_me.json()["email"] == "unique@example.com"

def test_guest_auth(client):
    r = client.post("/api/auth/guest")
    assert r.status_code == 200
    data = r.json()
    assert data["user"]["role"] == "guest"
    assert "token" in data
