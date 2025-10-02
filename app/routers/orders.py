from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database
from fastapi.security import oauth2_scheme
from jose import jwt, JWTError
from ..auth import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/orders", tags=["orders"])


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    return crud.create_order(db=db, order=order)


@router.get("/{code}", response_model=schemas.Order)
def read_order(code: str, db: Session = Depends(get_db)):
    db_order = crud.get_order_by_code(db=db, code=code)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {
            "username": payload.get("sub"),
            "is_admin": payload.get("is_admin"),
            "id": payload.get("user_id"),
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/orders/", response_model=schemas.Order)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.create_order(db=db, order=order, user_id=current_user["id"])


@router.get("/orders/", response_model=list[schemas.Order])
def read_orders(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user["is_admin"]:
        return crud.get_all_orders(db)
    return crud.get_orders_by_user(db, current_user["id"])
