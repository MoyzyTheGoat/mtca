from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database

router = APIRouter(tags=["orders"])


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/orders/", response_model=schemas.OrderBase)
def create_order(order: schemas.OrderBase, db: Session = Depends(get_db)):
    return crud.create_order(db, order)


@router.put("/orders/{order_id}", response_model=schemas.OrderBase)
def update_order(
    order_id: int, order: schemas.OrderBase, db: Session = Depends(get_db)
):
    db_order = crud.update_order(db, order_id, order)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order


@router.get("/orders/", response_model=list[schemas.OrderBase])
def read_orders(db: Session = Depends(get_db)):
    return crud.get_all_orders(db)


@router.delete("/orders/{order_id}", response_model=schemas.OrderBase)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.delete_order(db, order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order
