import os
from fastapi import FastAPI
from .database import engine, Base
from .routers import products, orders, users
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Queue Reducer")


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ✅ Automatically create database tables
Base.metadata.create_all(bind=engine)

app.include_router(products.router)
app.include_router(orders.router)
app.include_router(users.router)

from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # URLs allowed to access the backend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)
