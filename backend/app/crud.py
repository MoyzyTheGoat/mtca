from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from passlib.context import CryptContext
from typing import List, Dict
from . import models, schemas
import random
import string

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


# ----------------------------------------------------------------------------
# Utility functions
# ----------------------------------------------------------------------------
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ----------------------------------------------------------------------------
# User CRUD
# ----------------------------------------------------------------------------
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def create_user(db: Session, username: str, password: str, is_admin: bool = False):
    hashed_pw = get_password_hash(password)
    user = models.User(username=username, hashed_password=hashed_pw, is_admin=is_admin)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user


# ----------------------------------------------------------------------------
# Product CRUD
# ----------------------------------------------------------------------------
def get_all_products(db: Session) -> List[models.Product]:
    return db.query(models.Product).all()


def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()


def create_product(db: Session, product_data: Dict):
    product = models.Product(**product_data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, update_data: schemas.ProductUpdate):
    product = get_product(db, product_id)
    if not product:
        return None
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int):
    product = get_product(db, product_id)
    if not product:
        return None
    db.delete(product)
    db.commit()
    return product


# ----------------------------------------------------------------------------
# Order CRUD
# ----------------------------------------------------------------------------
def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def get_all_orders(db: Session):
    """Return all orders with their items, totals, and code."""
    orders = db.query(models.Order).all()
    response = []

    for order in orders:
        # Safely calculate total if product has a price
        price = order.product.price if hasattr(order.product, "price") else 0
        total = round(order.quantity * price, 2)

        response.append(
            {
                "code": order.code,
                "items": [
                    {
                        "product_name": order.product.name,
                        "quantity": order.quantity,
                    }
                ],
                "total": total,
                "collected": order.collected,
            }
        )

    return response


def get_order_by_code(db: Session, code: str):
    """Return a single order by its code, including total and items."""
    order = db.query(models.Order).filter(models.Order.code == code).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with code {code} not found",
        )

    # Safely calculate total
    price = order.product.price if hasattr(order.product, "price") else 0
    total = round(order.quantity * price, 2)

    return {
        "code": order.code,
        "items": [
            {
                "product_name": order.product.name,
                "quantity": order.quantity,
            }
        ],
        "total": total,
        "collected": order.collected,
    }


def generate_order_code(db: Session):
    """Generate a unique 6-character alphanumeric order code."""
    characters = string.ascii_uppercase + string.digits
    while True:
        code = "".join(random.choices(characters, k=6))
        existing_order = (
            db.query(models.Order).filter(models.Order.code == code).first()
        )
        if not existing_order:
            return code


def create_orders(db: Session, orders: List[schemas.OrderCreate]):
    """Create an order with one pickup code for multiple items."""
    order_code = generate_order_code(db)
    total = 0.0
    order_items = []

    for order_data in orders:
        product = get_product(db, order_data.product_id)
        if not product:
            raise HTTPException(
                status_code=404, detail=f"Product {order_data.product_id} not found"
            )
        if product.quantity < order_data.quantity:
            raise HTTPException(
                status_code=400, detail=f"Insufficient quantity for {product.name}"
            )

        # Deduct stock
        product.quantity -= order_data.quantity

        # Compute total for this item
        item_total = product.price * order_data.quantity
        total += item_total

        # ✅ Set total_amount for each order record
        new_order = models.Order(
            product_id=order_data.product_id,
            quantity=order_data.quantity,
            code=order_code,
            collected=False,
            total_amount=item_total,  # <---- ADD THIS
        )

        db.add(new_order)

        order_items.append(
            {"product_name": product.name, "quantity": order_data.quantity}
        )

    db.commit()

    return {
        "code": order_code,
        "total": round(total, 2),
        "collected": False,
        "items": order_items,
    }


def mark_orders_collected_by_code(db: Session, code: str):
    """Mark all orders with the given code as collected."""
    orders = db.query(models.Order).filter(models.Order.code == code).all()
    if not orders:
        raise HTTPException(status_code=404, detail="No orders found with that code")
    for order in orders:
        order.collected = True
    db.commit()
    return orders
