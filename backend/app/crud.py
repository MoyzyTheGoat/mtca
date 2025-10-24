from sqlalchemy.orm import Session
from . import models, schemas
import secrets
import string
from passlib.context import CryptContext
from passlib.exc import MissingBackendError
from fastapi import Request

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
def create_order(db: Session, order: list[schemas.OrderCreate]):
    for item in order:
        if isinstance(item, dict):
            item = schemas.OrderCreate(**item)
        product = (
            db.query(models.Product)
            .filter(models.Product.id == item.product_id)
            .first()
        )
        if not product:
            raise ValueError(f"Product with ID {item.product_id} does not exist")

        db_order = models.Order(**item.dict())
        # generate unique 6-character alphanumeric code
        code_str = "".join(
            secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6)
        )
        # ensure code uniqueness (simple loop)
        while db.query(models.Order).filter(models.Order.code == code_str).first():
            code_str = "".join(
                secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6)
            )
        db_order.code = code_str
        db.add(db_order)
        db.commit()
        return db_order

    # ensure code uniqueness (simple loop)
    while db.query(models.Order).filter(models.Order.code == code_str).first():
        code_str = "".join(
            secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6)
        )

    db_order.code = code_str
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


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
    return db.query(models.Order).filter(models.Order.code == code).first()


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
