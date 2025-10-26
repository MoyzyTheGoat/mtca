from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from passlib.context import CryptContext
from typing import List, Dict
from . import models, schemas
import random
import string
from datetime import datetime
from sqlalchemy import func


pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


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


def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def get_all_orders(db: Session):
    """
    Return grouped orders by code.
    Each item in the returned list has the shape:
    {
      "code": "...",
      "items": [{ "product_name": "...", "quantity": n, "price": x?, "subtotal": y? }, ...],
      "total": 123.45,
      "collected": True/False,
      "created_at": <datetime>
    }
    """
    orders = db.query(models.Order).order_by(models.Order.created_at.desc()).all()
    grouped: Dict[str, Dict] = {}

    for ord_row in orders:
        code = ord_row.code or "UNKNOWN"
        if code not in grouped:
            grouped[code] = {
                "code": code,
                "items": [],
                "total": 0.0,
                # start collected as True and AND with each row (so any False -> False)
                "collected": True,
                "created_at": getattr(ord_row, "created_at", None),
            }

        product = getattr(ord_row, "product", None)
        product_name = (
            getattr(product, "name", "Unknown") if product is not None else "Unknown"
        )
        price = getattr(product, "price", None) if product is not None else None
        quantity = getattr(ord_row, "quantity", 0)
        row_total_amount = getattr(ord_row, "total_amount", None)

        if price is not None:
            subtotal = round(price * (quantity or 0), 2)
            grouped[code]["items"].append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "price": price,
                    "subtotal": subtotal,
                }
            )
            grouped[code]["total"] += subtotal
        else:
            # fallback when product.price is not available; try row total_amount
            grouped[code]["items"].append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                }
            )
            grouped[code]["total"] += float(row_total_amount or 0.0)

        # track collected status (true only if every row for code is collected)
        grouped[code]["collected"] = grouped[code]["collected"] and bool(
            ord_row.collected
        )

        # keep earliest created_at for the group if missing (or just keep first seen)
        if grouped[code]["created_at"] is None:
            grouped[code]["created_at"] = getattr(ord_row, "created_at", None)

    # convert to list, sort by created_at desc (newest first)
    results = list(grouped.values())
    results.sort(key=lambda x: x.get("created_at") or datetime.min, reverse=True)

    # Round totals
    for r in results:
        r["total"] = round(r.get("total", 0.0) or 0.0, 2)

    return results


def get_order_by_code(db: Session, code: str):
    orders = db.query(models.Order).filter(models.Order.code == code).all()

    if not orders:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with code {code} not found",
        )

    items = []
    total = 0

    for order in orders:
        product = order.product  # Assuming a relationship exists: Order.product
        price = getattr(product, "price", 0)
        quantity = getattr(order, "quantity", 0)
        total += price * quantity

        items.append(
            {
                "product_name": getattr(product, "name", "Unknown"),
                "quantity": quantity,
                "price": price,
                "subtotal": round(price * quantity, 2),
            }
        )

    return {
        "code": code,
        "items": items,
        "total": round(total, 2),
        "collected": orders[0].collected,
    }


def generate_order_code(db: Session):
    characters = string.ascii_uppercase + string.digits
    while True:
        code = "".join(random.choices(characters, k=6))
        existing_order = (
            db.query(models.Order).filter(models.Order.code == code).first()
        )
        if not existing_order:
            return code


def create_orders(
    db: Session, orders: List[schemas.OrderCreate], user_id: int | None = None
):
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

        product.quantity -= order_data.quantity

        item_total = product.price * order_data.quantity
        total += item_total

        new_order = models.Order(
            product_id=order_data.product_id,
            quantity=order_data.quantity,
            code=order_code,
            collected=False,
            total_amount=item_total,
            user_id=user_id,  # 👈 save who placed it
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
    orders = db.query(models.Order).filter(models.Order.code == code).all()
    if not orders:
        raise HTTPException(status_code=404, detail="No orders found with that code")
    for order in orders:
        order.collected = True
    db.commit()
    return orders


def get_user_orders_grouped(db: Session, user_id: int):
    """
    Return grouped orders for a specific user (grouped by code).
    Each group includes multiple items with total price, etc.
    """
    orders = (
        db.query(models.Order)
        .filter(models.Order.user_id == user_id)
        .order_by(models.Order.created_at.desc())
        .all()
    )

    grouped = {}

    for ord_row in orders:
        code = ord_row.code or "UNKNOWN"
        if code not in grouped:
            grouped[code] = {
                "code": code,
                "items": [],
                "total": 0.0,
                "collected": True,
                "created_at": getattr(ord_row, "created_at", None),
            }

        product = getattr(ord_row, "product", None)
        product_name = getattr(product, "name", "Unknown") if product else "Unknown"
        price = getattr(product, "price", 0.0)
        quantity = getattr(ord_row, "quantity", 0)
        subtotal = round(price * quantity, 2)

        grouped[code]["items"].append(
            {
                "product_name": product_name,
                "quantity": quantity,
                "price": price,
                "subtotal": subtotal,
            }
        )

        grouped[code]["total"] += subtotal
        grouped[code]["collected"] = grouped[code]["collected"] and ord_row.collected
        if grouped[code]["created_at"] is None:
            grouped[code]["created_at"] = getattr(ord_row, "created_at", None)

    results = list(grouped.values())
    results.sort(key=lambda x: x.get("created_at") or datetime.min, reverse=True)

    return results


def get_user_order_by_code(db: Session, user_id: int, code: str):
    """
    Return grouped order for this user filtered by code (case-insensitive).
    """
    normalized_code = code.strip().upper()

    orders = (
        db.query(models.Order)
        .filter(
            models.Order.user_id == user_id,
            func.upper(models.Order.code) == normalized_code,
        )
        .order_by(models.Order.created_at.desc())
        .all()
    )

    if not orders:
        return None

    items = []
    total = 0.0
    collected = True
    created_at = None

    for o in orders:
        product = o.product
        price = product.price if product else 0
        subtotal = round(price * o.quantity, 2)
        items.append(
            {
                "product_name": product.name if product else "Unknown",
                "quantity": o.quantity,
                "price": price,
                "subtotal": subtotal,
            }
        )
        total += subtotal
        collected = collected and o.collected
        created_at = created_at or o.created_at

    return {
        "code": normalized_code,
        "items": items,
        "total": total,
        "collected": collected,
        "created_at": created_at,
    }
