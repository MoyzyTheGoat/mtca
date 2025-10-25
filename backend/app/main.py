import os
from fastapi import FastAPI
from .database import engine, Base, SessionLocal
from .crud import get_password_hash
from . import models
from .routers import products, orders, users
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="MTCA Backend")

# ✅ Create static folders if missing
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
IMAGES_DIR = os.path.join(STATIC_DIR, "images")

os.makedirs(IMAGES_DIR, exist_ok=True)  # <---- ensure /static/images exists

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ✅ Automatically create database tables
Base.metadata.create_all(bind=engine)


@app.on_event("startup")
def seed_admin():
    """Auto-seed an admin user on startup if none exists."""
    db = SessionLocal()
    try:
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

        existing_admin = (
            db.query(models.User).filter(models.User.username == admin_username).first()
        )

        if not existing_admin:
            hashed_pw = get_password_hash(admin_password)
            admin_user = models.User(
                username=admin_username, hashed_password=hashed_pw, is_admin=True
            )
            db.add(admin_user)
            db.commit()
            print(f"✅ Admin user seeded: {admin_username}")
        else:
            print("✅ Admin already exists, skipping seed.")
    except Exception as e:
        print(f"❌ Failed to seed admin: {e}")
    finally:
        db.close()


app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(users.router, tags=["users"])


# ✅ CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
