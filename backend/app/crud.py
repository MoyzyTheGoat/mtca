# app/crud.py
from typing import List, Dict, Optional
from datetime import datetime
import random
import string

from passlib.context import CryptContext
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException, status

from . import models, schemas

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
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check for existing orders
    if db.query(models.Order).filter(models.Order.product_id == product_id).first():
        raise HTTPException(
            status_code=400, detail="Cannot delete product with existing orders"
        )

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}


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
    db: Session, orders: List[schemas.OrderCreate], user_id: Optional[int] = None
):
    if not orders:
        raise HTTPException(status_code=400, detail="No order items provided")

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

        # decrement inventory
        product.quantity -= order_data.quantity

        # snapshot the current product price
        unit_price = float(product.price or 0.0)
        item_total = round(unit_price * order_data.quantity, 2)
        total += item_total

        # create a single row per item but include immutable snapshot fields
        new_order = models.Order(
            product_id=order_data.product_id,
            quantity=order_data.quantity,
            code=order_code,
            collected=False,
            total_amount=item_total,  # backward-compat
            unit_price=unit_price,  # snapshot
            line_total=item_total,  # snapshot
            user_id=user_id,
        )

        db.add(new_order)

        order_items.append(
            {
                "product_name": product.name,
                "quantity": order_data.quantity,
                "price": unit_price,
                "subtotal": item_total,
            }
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


def get_all_orders(db: Session) -> List[Dict]:
    orders = (
        db.query(models.Order)
        .options(joinedload(models.Order.product), joinedload(models.Order.user))
        .order_by(models.Order.created_at.desc())
        .all()
    )

    grouped: Dict[str, Dict] = {}

    for ord_row in orders:
        code = ord_row.code or "UNKNOWN"
        if code not in grouped:
            user_obj = getattr(ord_row, "user", None)
            grouped[code] = {
                "code": code,
                "items": [],
                "total": 0.0,
                "collected": True,
                "created_at": getattr(ord_row, "created_at", None),
                "user": (
                    {
                        "id": getattr(user_obj, "id", None),
                        "username": getattr(user_obj, "username", None),
                    }
                    if user_obj
                    else None
                ),
            }

        product = getattr(ord_row, "product", None)
        product_name = getattr(product, "name", "Unknown") if product else "Unknown"

        # Prefer snapshot unit_price/line_total on the order row; fall back to product.price/total_amount
        unit_price = getattr(ord_row, "unit_price", None)
        line_total = getattr(ord_row, "line_total", None)
        row_total_amount = getattr(ord_row, "total_amount", None)
        quantity = getattr(ord_row, "quantity", 0)

        if unit_price is not None and not (
            unit_price == 0 and line_total is None and row_total_amount is None
        ):
            subtotal = round(unit_price * (quantity or 0), 2)
            grouped[code]["items"].append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "price": float(unit_price),
                    "subtotal": float(subtotal),
                }
            )
            grouped[code]["total"] += subtotal
        elif line_total is not None:
            grouped[code]["items"].append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "price": float(unit_price) if unit_price is not None else None,
                    "subtotal": float(line_total),
                }
            )
            grouped[code]["total"] += float(line_total or 0.0)
        elif getattr(product, "price", None) is not None:
            # last-resort: use product price (should not be used for historical correctness if snapshot exists)
            price = float(getattr(product, "price", 0.0))
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
            # fallback to stored row total_amount
            grouped[code]["items"].append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "subtotal": float(row_total_amount or 0.0),
                }
            )
            grouped[code]["total"] += float(row_total_amount or 0.0)

        # If grouped user is empty, try set from this row (first non-null)
        if not grouped[code].get("user"):
            u = getattr(ord_row, "user", None)
            grouped[code]["user"] = (
                {"id": getattr(u, "id", None), "username": getattr(u, "username", None)}
                if u
                else None
            )

        # only true if all rows are collected
        grouped[code]["collected"] = grouped[code]["collected"] and bool(
            ord_row.collected
        )

        # prefer earliest non-null created_at (we set on creation above)
        if grouped[code]["created_at"] is None:
            grouped[code]["created_at"] = getattr(ord_row, "created_at", None)

    results = list(grouped.values())
    # sort by created_at desc (newest first)
    results.sort(key=lambda x: x.get("created_at") or datetime.min, reverse=True)

    # round totals and ensure types are JSON-safe
    for r in results:
        r["total"] = round(r.get("total", 0.0) or 0.0, 2)

    return results


def get_order_by_code(db: Session, code: str) -> Dict:
    orders = (
        db.query(models.Order)
        .options(joinedload(models.Order.product), joinedload(models.Order.user))
        .filter(models.Order.code == code)
        .order_by(models.Order.created_at.asc())
        .all()
    )

    if not orders:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with code {code} not found",
        )

    items = []
    total = 0.0
    collected = True
    created_at = None
    user_obj = getattr(orders[0], "user", None)

    for order in orders:
        product = order.product
        product_name = getattr(product, "name", "Unknown") if product else "Unknown"

        unit_price = getattr(order, "unit_price", None)
        line_total = getattr(order, "line_total", None)
        total_amount = getattr(order, "total_amount", None)

        quantity = getattr(order, "quantity", 0)

        if unit_price is not None:
            subtotal = round(unit_price * quantity, 2)
            price_val = float(unit_price)
            items.append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "price": price_val,
                    "subtotal": float(subtotal),
                }
            )
            total += subtotal
        elif line_total is not None:
            items.append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "subtotal": float(line_total),
                }
            )
            total += float(line_total or 0.0)
        elif getattr(product, "price", None) is not None:
            price_val = float(getattr(product, "price", 0.0))
            subtotal = round(price_val * quantity, 2)
            items.append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "price": price_val,
                    "subtotal": subtotal,
                }
            )
            total += subtotal
        else:
            items.append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "subtotal": float(total_amount or 0.0),
                }
            )
            total += float(total_amount or 0.0)

        collected = collected and bool(order.collected)
        created_at = created_at or getattr(order, "created_at", None)

    return {
        "code": code,
        "items": items,
        "total": round(total, 2),
        "collected": collected,
        "created_at": created_at,
        "user": (
            {
                "id": getattr(user_obj, "id", None),
                "username": getattr(user_obj, "username", None),
            }
            if user_obj
            else None
        ),
    }


def get_user_orders_grouped(db: Session, user_id: int) -> List[Dict]:
    orders = (
        db.query(models.Order)
        .options(joinedload(models.Order.product))
        .filter(models.Order.user_id == user_id)
        .order_by(models.Order.created_at.desc())
        .all()
    )

    grouped: Dict[str, Dict] = {}

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

        unit_price = getattr(ord_row, "unit_price", None)
        line_total = getattr(ord_row, "line_total", None)
        total_amount = getattr(ord_row, "total_amount", None)
        quantity = getattr(ord_row, "quantity", 0)

        if unit_price is not None:
            subtotal = round(unit_price * quantity, 2)
            grouped[code]["items"].append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "price": float(unit_price),
                    "subtotal": float(subtotal),
                }
            )
            grouped[code]["total"] += subtotal
        elif line_total is not None:
            grouped[code]["items"].append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "subtotal": float(line_total),
                }
            )
            grouped[code]["total"] += float(line_total or 0.0)
        elif getattr(product, "price", None) is not None:
            price = float(getattr(product, "price", 0.0))
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
        else:
            grouped[code]["items"].append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "subtotal": float(total_amount or 0.0),
                }
            )
            grouped[code]["total"] += float(total_amount or 0.0)

        grouped[code]["collected"] = grouped[code]["collected"] and bool(
            ord_row.collected
        )

        if grouped[code]["created_at"] is None:
            grouped[code]["created_at"] = getattr(ord_row, "created_at", None)

    results = list(grouped.values())
    results.sort(key=lambda x: x.get("created_at") or datetime.min, reverse=True)

    for r in results:
        r["total"] = round(r.get("total", 0.0) or 0.0, 2)

    return results


def get_user_order_by_code(db: Session, user_id: int, code: str) -> Optional[Dict]:
    normalized_code = code.strip().upper()

    orders = (
        db.query(models.Order)
        .options(joinedload(models.Order.product))
        .filter(
            models.Order.user_id == user_id,
            func.upper(models.Order.code) == normalized_code,
        )
        .order_by(models.Order.created_at.asc())
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
        product_name = getattr(product, "name", "Unknown") if product else "Unknown"

        unit_price = getattr(o, "unit_price", None)
        line_total = getattr(o, "line_total", None)
        total_amount = getattr(o, "total_amount", None)
        quantity = getattr(o, "quantity", 0)

        if unit_price is not None:
            subtotal = round(unit_price * quantity, 2)
            items.append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "price": float(unit_price),
                    "subtotal": float(subtotal),
                }
            )
            total += subtotal
        elif line_total is not None:
            items.append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "subtotal": float(line_total),
                }
            )
            total += float(line_total or 0.0)
        elif getattr(product, "price", None) is not None:
            price = float(getattr(product, "price", 0.0))
            subtotal = round(price * quantity, 2)
            items.append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "price": price,
                    "subtotal": subtotal,
                }
            )
            total += subtotal
        else:
            items.append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "subtotal": float(total_amount or 0.0),
                }
            )
            total += float(total_amount or 0.0)

        collected = collected and bool(o.collected)
        created_at = created_at or getattr(o, "created_at", None)

    return {
        "code": normalized_code,
        "items": items,
        "total": round(total, 2),
        "collected": collected,
        "created_at": created_at,
    }
