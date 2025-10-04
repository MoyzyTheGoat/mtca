def test_place_order(client, admin_token, regular_user):
    # Add products first
    headers = {"Authorization": f"Bearer {admin_token}"}
    client.post("/products/", json={"name": "Milk", "price": 4.0}, headers=headers)
    client.post("/products/", json={"name": "Bread", "price": 2.0}, headers=headers)

    # Place order
    products = [{"product_id": 1, "quantity": 2}, {"product_id": 2, "quantity": 1}]
    response = client.post("/orders/", json={"products": products}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "code" in data
    assert len(data["code"]) == 6


def test_read_orders(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Place an order
    client.post("/products/", json={"name": "Eggs", "price": 5.0}, headers=headers)
    products = [{"product_id": 1, "quantity": 1}]
    order_resp = client.post("/orders/", json={"products": products}, headers=headers)
    code = order_resp.json()["code"]

    # Retrieve order by code
    response = client.get(f"/orders/{code}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == code
    assert len(data["products"]) >= 1
