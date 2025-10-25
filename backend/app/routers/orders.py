from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, auth, models
from ..database import get_db

router = APIRouter(tags=["orders"])


@router.post("/", response_model=schemas.OrderResponse)
def create_order(
    order: list[schemas.OrderCreate],
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    try:
        return crud.create_order(db, order)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{order_id}", response_model=schemas.Order)
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


@router.get("/", response_model=list[schemas.Order])
def read_orders(
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
    limit: int = 10,
    offset: int = 0,
):
    return crud.get_all_orders(db, limit=limit, offset=offset)


@router.get("/code/{code}", response_model=list[schemas.Order])
def get_orders_by_code(code: str, db: Session = Depends(get_db)):
    code = code.upper()
    orders = crud.get_order_by_code(db, code)
    if not orders:
        raise HTTPException(status_code=404, detail="No orders found with this code")
    return [
        {"id": o.id, "product_id": o.product_id, "quantity": o.quantity, "code": o.code}
        for o in orders
    ]


@router.delete("/{order_id}", response_model=schemas.Order)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    db_order = crud.delete_order(db, order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order


@router.get("/{order_id}", response_model=schemas.Order)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/collect/{code}", response_model=list[schemas.Order])
def collect_order_by_code(
    code: str,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin),
):
    """
    Admin-only: mark all order rows that share this pickup code as collected.
    Returns the affected orders.
    """
    try:
        rows = crud.mark_orders_collected_by_code(db, code)
        if not rows:
            raise HTTPException(status_code=404, detail="Order code not found")
        return rows
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
