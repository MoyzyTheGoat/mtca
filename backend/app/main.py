from fastapi import FastAPI
from .database import engine, Base
from .routers import products, orders, users

app = FastAPI(title="Queue Reducer")

# create tables

app.include_router(products.router)
app.include_router(orders.router)
app.include_router(users.router)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
