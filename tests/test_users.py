def test_register_login(client):
    # Register new user
    response = client.post(
        "/users/", json={"username": "testuser", "password": "pass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert "id" in data

    # Login
    response = client.post(
        "/login", data={"username": "testuser", "password": "pass123"}
    )
    assert response.status_code == 200
    token = response.json().get("access_token")
    assert token is not None
