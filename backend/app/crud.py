from sqlalchemy.orm import Session
from . import models, schemas
import secrets
import string
from passlib.context import CryptContext
from passlib.exc import MissingBackendError
from fastapi import Request
from sqlalchemy.exc import IntegrityError
import random
from sqlalchemy import func

# Use Argon2
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def get_password_hash(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except MissingBackendError:
        raise RuntimeError("Missing Argon2")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_product(db: Session, product: schemas.ProductCreate, image_url: str = None):
    db_product = models.Product(
        name=product.name,
        description=product.description,
        price=product.price,
        quantity=product.quantity,
        image_url=image_url,  # ensure this is passed
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int):
    db_product = (
        db.query(models.Product).filter(models.Product.id == product_id).first()
    )
    if db_product:
        db.delete(db_product)
        db.commit()
    return db_product


def update_product(db: Session, product_id: int, product: schemas.ProductUpdate):
    db_product = (
        db.query(models.Product).filter(models.Product.id == product_id).first()
    )
    if db_product:
        for key, value in product.dict(exclude_unset=True).items():
            if key == "id":
                continue
            setattr(db_product, key, value)
        db.commit()
        db.refresh(db_product)
    return db_product


def get_all_products(
    db: Session, limit: int = 10, offset: int = 0, request: Request = None
):
    products = db.query(models.Product).limit(limit).offset(offset).all()
    if request:
        base_url = str(request.base_url).rstrip("/")
        for p in products:
            if p.image_url and not p.image_url.startswith("http"):
                p.image_url = f"{base_url}{p.image_url}"
    return products


# ORDERS
def generate_unique_code(db: Session, length: int = 6) -> str:
    while True:
        code = "".join(
            secrets.choice(string.ascii_uppercase + string.digits)
            for _ in range(length)
        ).upper()
        # case-insensitive guard
        if (
            not db.query(models.Order)
            .filter(func.upper(models.Order.code) == code)
            .first()
        ):
            return code


def create_order(db: Session, order_items: list[schemas.OrderCreate]):
    if not order_items:
        raise ValueError("Order list cannot be empty")

    # generate one shared code for this entire checkout
    code_str = generate_unique_code(db)

    created_orders = []
    for item in order_items:
        if isinstance(item, dict):
            item = schemas.OrderCreate(**item)

        product = (
            db.query(models.Product)
            .filter(models.Product.id == item.product_id)
            .first()
        )
        if not product:
            raise ValueError(f"Product with ID {item.product_id} does not exist")

        db_order = models.Order(**item.dict(), code=code_str)
        db.add(db_order)
        created_orders.append(db_order)

    # single commit for the whole order
    db.commit()
    for o in created_orders:
        db.refresh(o)

    # return the pickup code and created items (explicitly serializable)
    return {
        "message": "Order created successfully",
        "code": code_str,
        "orders": [
            {
                "id": o.id,
                "product_id": o.product_id,
                "quantity": o.quantity,
                "code": o.code,
            }
            for o in created_orders
        ],
    }


def update_order(db: Session, order_id: int, order: schemas.OrderUpdate):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if db_order:
        for key, value in order.dict(exclude_unset=True).items():
            if key in ("id", "code"):
                continue
            setattr(db_order, key, value)
        db.commit()
        db.refresh(db_order)
    return db_order


def get_all_orders(db: Session, limit: int = 10, offset: int = 0):
    return db.query(models.Order).limit(limit).offset(offset).all()


def delete_order(db: Session, order_id: int):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if db_order:
        db.delete(db_order)
        db.commit()
    return db_order


def get_order_by_code(db: Session, code: str):
    return (
        db.query(models.Order)
        .filter(func.upper(models.Order.code) == code.upper())
        .all()
    )


# USERS
def create_user(db: Session, user: schemas.UserCreate):
    hashed_pw = get_password_hash(user.password)
    db_user = models.User(
        username=user.username, hashed_password=hashed_pw, is_admin=user.is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()


def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def mark_orders_collected_by_code(db: Session, code: str):
    """Mark all order rows that have this code as collected.
    Returns list of updated Order ORM objects.
    """
    rows = db.query(models.Order).filter(models.Order.code == code).all()
    if not rows:
        return []
    # if any row already collected -> return rows and indicate already collected
    already = all(r.collected for r in rows)
    if already:
        raise ValueError("Order code already collected")

    for r in rows:
        r.collected = True
        db.add(r)
    db.commit()
    # refresh and return
    for r in rows:
        db.refresh(r)
    return rows


def mark_order_collected_by_id(db: Session, order_id: int):
    """Mark a single order row collected by its id."""
    r = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not r:
        return None
    if r.collected:
        raise ValueError("Order already collected")
    r.collected = True
    db.add(r)
    db.commit()
    db.refresh(r)
    return r
