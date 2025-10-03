from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database
from .auth import oauth2_scheme
from jose import jwt, JWTError

router = APIRouter(prefix="/orders", tags=["orders"])


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
