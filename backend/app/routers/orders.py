# routers/orders.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, auth, models
from ..database import get_db
from sqlalchemy import func

router = APIRouter()


from fastapi import Body


@router.post(
    "/",
    response_model=schemas.OrderResponse,
    dependencies=[Depends(auth.get_current_user)],
)
def create_orders_endpoint(
    orders: List[schemas.OrderCreate] = Body(...),
    db: Session = Depends(get_db),
):
    """Create an order containing one or more products."""
    return crud.create_orders(db, orders)


@router.get("/", response_model=List[schemas.OrderResponse])
def read_orders(db: Session = Depends(get_db)):
    return crud.get_all_orders(db)


@router.get("/{code}", response_model=schemas.OrderResponse)
def read_order_by_code(code: str, db: Session = Depends(get_db)):
    return crud.get_order_by_code(db, code)


@router.patch("/{code}", dependencies=[Depends(auth.get_current_admin)])
def mark_order_collected(code: str, db: Session = Depends(get_db)):
    """Mark orders as collected by code (admin only)."""
    crud.mark_orders_collected_by_code(db, code)
    return {"message": f"Orders with code {code} marked as collected"}
