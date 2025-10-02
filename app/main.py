from fastapi import FastAPI
from app.database import engine, Base
from app.routers import products, orders


Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(products.router)
app.include_router(orders.router)
