from fastapi import FastAPI
from .database import engine, Base
from .routers import products, orders

app = FastAPI(title="Queue Reducer")

Base.metadata.create_all(bind=engine)

app.include_router(products.router)
app.include_router(orders.router)
