from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database

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
