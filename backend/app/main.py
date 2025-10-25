# main.py
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .database import Base, engine
from .crud import get_password_hash
from . import models
from .routers import users, products, orders, stats

load_dotenv()
app = FastAPI(title="MTCA API")


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


STATIC_DIR = os.path.join(BASE_DIR, "..", "static")


os.makedirs(os.path.join(STATIC_DIR, "images"), exist_ok=True)


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


Base.metadata.create_all(bind=engine)


@app.on_event("startup")
def seed_admin():
    from .database import SessionLocal

    db = SessionLocal()
    try:
        admin_user = os.getenv("ADMIN_USERNAME", "admin")
        admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
        if not db.query(models.User).filter(models.User.username == admin_user).first():
            hashed = get_password_hash(admin_pass)
            db.add(
                models.User(username=admin_user, hashed_password=hashed, is_admin=True)
            )
            db.commit()
            print(f"Admin user '{admin_user}' created.")
    finally:
        db.close()


app.include_router(users.router, tags=["users"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])


origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
