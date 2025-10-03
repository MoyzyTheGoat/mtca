from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas, crud
from ..database import SessionLocal

router = APIRouter(prefix="/products", tags=["products"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=schemas.ProductOut)
def create_product_endpoint(
    product: schemas.ProductCreate, db: Session = Depends(get_db)
):
    try:
        return crud.create_product(db, product)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[schemas.ProductOut])
def list_products_endpoint(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    return crud.get_products(db, skip=skip, limit=limit)
