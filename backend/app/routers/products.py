from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, auth
from ..database import get_db

router = APIRouter(tags=["products"])


@router.post("/products/", response_model=schemas.Product)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_admin),
):
    return crud.create_product(db, product)


@router.get("/products/", response_model=list[schemas.Product])
def read_products(db: Session = Depends(get_db), limit: int = 10, offset: int = 0):
    return crud.get_all_products(db, limit=limit, offset=offset)


@router.put("/products/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    product: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_admin),
):
    db_product = crud.update_product(db, product_id, product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product


@router.delete("/products/{product_id}", response_model=schemas.Product)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_admin),
):
    db_product = crud.delete_product(db, product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product


@router.get("/{product_id}", response_model=schemas.Product)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
