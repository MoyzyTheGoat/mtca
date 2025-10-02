from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from ..auth import SECRET_KEY, ALGORITHM
from sqlalchemy.orm import Session
from fastapi import APIRouter
from .. import crud, schemas, database

OAuth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter(prefix="/products", tags=["products"])


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db=db, product=product)


@router.get("/", response_model=list[schemas.Product])
def read_products(db: Session = Depends(get_db)):
    products = crud.get_products(db=db, product_id=0)
    return products


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        is_admin: bool = payload.get("is_admin")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"username": username, "is_admin": is_admin}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/products/", response_model=schemas.Product)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user["is_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can add products")
    return crud.create_product(db=db, product=product)
