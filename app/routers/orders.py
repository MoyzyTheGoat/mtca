from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, auth
from ..database import get_db

router = APIRouter(tags=["orders"])


@router.post("/orders/", response_model=schemas.Order)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    try:
        return crud.create_order(db, order)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/orders/{order_id}", response_model=schemas.Order)
def update_order(
    order_id: int,
    order: schemas.OrderUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    db_order = crud.update_order(db, order_id, order)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order


@router.get("/orders/", response_model=list[schemas.Order])
def read_orders(
    db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)
):
    return crud.get_all_orders(db)


@router.get("/orders/code/{code}", response_model=schemas.Order)
def get_order_by_code(
    code: str,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    order = crud.get_order_by_code(db, code)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.delete("/orders/{order_id}", response_model=schemas.Order)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    db_order = crud.delete_order(db, order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order
