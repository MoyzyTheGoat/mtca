from sqlalchemy.orm import Session
from . import models, schemas
import random
import string
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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


def get_all_orders(db: Session):
    return db.query(models.Order).all()


def get_orders_by_user(db: Session, user_id: int):
    return db.query(models.Order).filter(models.Order.user_id == user_id).all()


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = hash_password(user.password)
    db_user = models.User(
        username=user.username, email=user.email, hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()
