from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas, crud
from ..database import SessionLocal

router = APIRouter(prefix="/orders", tags=["orders"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=schemas.OrderOut)
def create_order_endpoint(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_order(db, order)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/code/{code}", response_model=schemas.OrderOut)
def get_order_by_code_endpoint(code: str, db: Session = Depends(get_db)):
    order = crud.get_order_by_code(db, code)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/code/{code}/pickup", response_model=schemas.OrderOut)
def pickup_order_endpoint(code: str, db: Session = Depends(get_db)):
    order = crud.get_order_by_code(db, code)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.picked_up:
        raise HTTPException(status_code=400, detail="Order already picked up")
    return crud.mark_order_picked(db, order)
