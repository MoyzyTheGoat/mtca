def test_admin_create_product(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post(
        "/products/", json={"name": "Apple", "price": 2.5}, headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Apple"


def test_user_cannot_create_product(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = client.post(
        "/products/", json={"name": "Banana", "price": 1.5}, headers=headers
    )
    assert response.status_code == 403  # Forbidden for regular user


def test_read_products(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Add a product
    client.post("/products/", json={"name": "Orange", "price": 3.0}, headers=headers)
    response = client.get("/products/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
