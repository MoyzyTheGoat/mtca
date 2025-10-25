# FreshMart - Supermarket Ordering System

A modern React + TypeScript frontend for a FastAPI supermarket backend with JWT authentication, role-based access, and seamless order management.

## 🚀 Quick Start

### Prerequisites
- Node.js & npm installed
- FastAPI backend running at `http://127.0.0.1:8000`

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://127.0.0.1:8000
```

## 🔐 Backend CORS Setup

**IMPORTANT:** Your FastAPI backend must allow CORS for the frontend to work. Add this to your FastAPI app:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🎯 Features

### For Customers
- **Browse Products**: View all available products with prices
- **Shopping Cart**: Add items, adjust quantities, and checkout
- **Order Pickup**: Get a unique pickup code and retrieve order details

### For Admins
- **Product Management**: Create and view all products
- **Order Search**: Look up any order by pickup code
- **Dashboard**: Centralized admin interface

### Authentication
- **Register**: Create account with optional admin privileges
- **Login**: JWT-based authentication with automatic token refresh
- **Protected Routes**: Role-based access control

## 📱 Pages

- `/` - Product catalog (public)
- `/login` - User login
- `/register` - New user registration
- `/cart` - Shopping cart & checkout (customers only)
- `/pickup` - Order pickup lookup (public)
- `/admin` - Admin dashboard (admins only)

## 🔒 Security Features

- JWT access & refresh tokens
- Automatic token refresh on expiration
- Protected routes with role verification
- Secure token storage in localStorage

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for blazing fast development
- **TailwindCSS** for styling
- **shadcn/ui** component library
- **Axios** for API requests
- **React Router** for navigation
- **React Query** for data fetching

## 📦 Project Structure

```
src/
├── api/
│   └── axios.ts          # API client with interceptors
├── components/
│   ├── ui/               # shadcn components
│   ├── Navbar.tsx        # Navigation bar
│   ├── ProductCard.tsx   # Product display
│   └── ProtectedRoute.tsx # Route guards
├── contexts/
│   └── AuthContext.tsx   # Authentication state
├── pages/
│   ├── Home.tsx          # Product listing
│   ├── Login.tsx         # Login page
│   ├── Register.tsx      # Registration
│   ├── Cart.tsx          # Shopping cart
│   ├── Pickup.tsx        # Order lookup
│   └── AdminDashboard.tsx # Admin panel
├── types/
│   └── index.ts          # TypeScript definitions
└── App.tsx               # Main app component
```

## 🔄 API Endpoints Used

### Authentication
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `GET /users/me` - Get current user

### Products
- `GET /products/` - List all products
- `POST /products/` - Create product (admin only)

### Orders
- `POST /orders/` - Create order
- `GET /orders/{code}` - Get order by pickup code

## 💡 Usage Tips

1. **First Time Setup**: Create an admin account by checking the "Register as admin account" box during registration
2. **Testing Orders**: As a customer, add products to cart and checkout to receive a pickup code
3. **Admin Access**: Admin users are automatically redirected to the dashboard after login
4. **Token Management**: Tokens are automatically refreshed - no manual intervention needed

## 🐛 Troubleshooting

### CORS Errors
Make sure your FastAPI backend has CORS middleware configured (see Backend CORS Setup above)

### Connection Refused
Verify your backend is running at `http://127.0.0.1:8000` or update `VITE_API_URL` in `.env`

### 401 Unauthorized
Try logging out and logging back in to refresh your tokens

## 📄 License

This project was built with [Lovable](https://lovable.dev)
