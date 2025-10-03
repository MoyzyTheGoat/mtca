from sqlalchemy.orm import Session
from . import models, schemas
import secrets
import string


def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.dict())
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


def update_product(db: Session, product_id: int, product: schemas.ProductCreate):
    db_product = (
        db.query(models.Product).filter(models.Product.id == product_id).first()
    )
    if db_product:
        for key, value in product.dict().items():
            setattr(db_product, key, value)
        db.commit()
        db.refresh(db_product)
    return db_product


def get_all_products(db: Session):
    return db.query(models.Product).all()


def create_order(db: Session, order: schemas.OrderBase):
    db_order = models.Order(**order.dict())

    # Generate a unique 6-character alphanumeric code
    code_str = "".join(
        secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6)
    )
    db_order.code = code_str
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


def update_order(db: Session, order_id: int, order: schemas.OrderBase):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if db_order:
        for key, value in order.dict().items():
            setattr(db_order, key, value)
        db.commit()
        db.refresh(db_order)
    return db_order


def get_all_orders(db: Session):
    return db.query(models.Order).all()


def delete_order(db: Session, order_id: int):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if db_order:
        db.delete(db_order)
        db.commit()
    return db_order
