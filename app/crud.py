from sqlalchemy.orm import Session
from . import models, schemas
import random
import string


def get_products(db: Session, product_id: int):
    return db.query(models.Product).all()


def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(
        name=product.name, price=product.price, quantity=product.quantity
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def generate_order_code(length=6):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def create_order(db: Session, order: schemas.OrderCreate):
    code = generate_order_code()
    db_order = models.Order(code=code, items=order.items)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


def get_order_by_code(db: Session, code: str):
    return db.query(models.Order).filter(models.Order.code == code).first()
