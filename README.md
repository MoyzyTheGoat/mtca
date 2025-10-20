🛒 FastAPI Supermarket Queue Reducer

This project is a FastAPI-based e-commerce system designed for supermarkets that want to reduce customer waiting time.

Instead of being a full online store, the flow is:

Admin adds products into the system.

Customer selects products and places an order.

A unique 6-character code is generated for the order.

At pickup, the customer gives the code → the admin retrieves the order → products are handed over quickly.

🚀 Features

📦 Product Management: Admin can create and list products.

🛍️ Cart & Checkout: Customers can add items and place an order.

🔑 Unique Order Codes: Each order gets a 6-character code for pickup.

🏪 Offline Friendly: Designed for supermarkets, not full online shops.

🗄️ SQLite + SQLAlchemy for data persistence.

⚡ FastAPI for API performance and documentation.

🛠️ Tech Stack

FastAPI

SQLite
 (can be swapped with PostgreSQL later)

SQLAlchemy

Uvicorn
 (server)

📂 Project Structure
ecommerce_app/
│── app/
│   ├── main.py          # FastAPI entrypoint
│   ├── database.py      # DB connection setup
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas
│   ├── crud.py          # Database logic
│   ├── routers/
│   │   ├── products.py  # Product routes
│   │   ├── orders.py    # Order routes
│── requirements.txt     # Dependencies
│── README.md            # Project documentation

⚡ Getting Started
1. Clone the repo
git clone https://github.com/MoyzyTheGoat/mtca.git
cd mtca

2. Create a virtual environment
python -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate      # Windows

3. Install dependencies
pip install -r requirements.txt

4. Run the app
uvicorn app.main:app --reload


API will be available at:
👉 http://127.0.0.1:8000

Swagger Docs:
👉 http://127.0.0.1:8000/docs

📖 Example Workflow

Admin: POST /products/ to add products.

Customer: POST /orders/ with product IDs + quantities.

System: Returns a code like X7P9QZ.

Admin: GET /orders/{code} to retrieve the order.

📝 Roadmap

 Add authentication (admin vs customer).

 Add PostgreSQL support.

 Add payment gateway integration.

 Dockerize for easy deployment.

🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

📜 License

This project is open-source under the MIT License
.