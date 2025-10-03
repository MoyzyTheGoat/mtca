from sqlalchemy.orm import Session
from . import models, schemas
import secrets
import string


def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(
        name=product.name, price=product.price, stock=product.stock
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()


def _generate_code():
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(6))


def _generate_unique_code(db: Session):
    for _ in range(1000):
        code = _generate_code()
        exists = db.query(models.Order).filter(models.Order.code == code).first()
        if not exists:
            return code
    raise Exception("Unable to generate unique code")


def create_order(db: Session, order_in: schemas.OrderCreate):
    code = _generate_unique_code(db)
    db_order = models.Order(code=code)
    db.add(db_order)
    for item in order_in.items:
        product = (
            db.query(models.Product)
            .filter(models.Product.id == item.product_id)
            .first()
        )
        if not product:
            db.rollback()
            raise ValueError(f"Product id {item.product_id} not found")
        if product.stock < item.quantity:
            db.rollback()
            raise ValueError(f"Not enough stock for product id {item.product_id}")
        product.stock -= item.quantity
        order_item = models.OrderItem(
            order=db_order,
            product_id=product.id,
            quantity=item.quantity,
            price_at_order=product.price,
        )
        db.add(order_item)
    db.commit()
    db.refresh(db_order)
    return db_order


def get_order_by_code(db: Session, code: str):
    return db.query(models.Order).filter(models.Order.code == code).first()


def mark_order_picked(db: Session, order: models.Order):
    order.picked_up = True
    db.add(order)
    db.commit()
    db.refresh(order)
    return order
