# FastAPI Supermarket System

A full-stack **FastAPI + React** e-commerce system for supermarkets designed to **manage products, orders, users, and analytics** in one complete site. Admins and customers can interact seamlessly, while analytics provide real-time insights into sales and top-selling products.

---

## 🛠 Tech Stack

- **Backend:** FastAPI, SQLAlchemy, SQLite (PostgreSQL ready)  
- **Frontend:** React, TypeScript, Tailwind CSS, Shadcn/ui  
- **Authentication:** JWT (Admin & Customer)  
- **Other:** Sonner for notifications, Lucide Icons  

---

## ⚡ Features

- **Product Management:** Create, update, delete, and list products with images.  
- **Order Management:** Place orders, search by 6-character code, mark as collected, and view totals.  
- **User Management:** Admins can manage users and authentication.  
- **Analytics & Stats:**  
  - Filter by day, week, month, year, or custom date ranges  
  - Total orders, revenue, monthly stats, top-selling products  
- **Real-time Updates:** Orders and stats auto-refresh for up-to-date information.  

---

## 🚀 Quick Start

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to access the full site.

---

## 👤 Author

Moyzy – [GitHub](https://github.com/MoyzyTheGoat)

---

## 📄 License

MIT License