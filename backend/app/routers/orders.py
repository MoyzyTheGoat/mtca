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
)
def create_orders_endpoint(
    orders: List[schemas.OrderCreate] = Body(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),  # ✅ get actual user
):
    return crud.create_orders(db, orders, user_id=current_user.id)  # ✅ pass user_id


@router.get("/", response_model=List[schemas.OrderResponse])
def read_orders(db: Session = Depends(get_db)):
    return crud.get_all_orders(db)


@router.get("/my")
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.get_user_orders_grouped(db, current_user.id)


@router.get("/my/{code}")
def get_my_order_by_code(
    code: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    result = crud.get_user_order_by_code(db, current_user.id, code.upper())
    if not result:
        raise HTTPException(status_code=404, detail="Order not found or not yours")
    return result


@router.get("/{code}", response_model=schemas.OrderResponse)
def read_order_by_code(code: str, db: Session = Depends(get_db)):
    return crud.get_order_by_code(db, code)


@router.patch("/{code}", dependencies=[Depends(auth.get_current_admin)])
def mark_order_collected(code: str, db: Session = Depends(get_db)):
    crud.mark_orders_collected_by_code(db, code)
    return {"message": f"Orders with code {code} marked as collected"}
