from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from .. import crud, schemas, auth, models  # 👈 notice the two dots (relative import)
from ..database import get_db
import os
import shutil
import re


router = APIRouter(tags=["products"])


UPLOAD_DIR = "app/static/images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static only once (usually done in main.py)
# app.mount("/static", StaticFiles(directory="app/static"), name="static")


@router.post("/products/", response_model=schemas.Product)
async def create_product(
    name: str = Form(...),
    price: float = Form(...),
    description: str = Form(""),
    quantity: int = Form(...),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin),
):
    image_url = None

    if image:
        os.makedirs("static/images", exist_ok=True)
        safe_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", image.filename)
        filename = f"static/images/{safe_name}"
        with open(filename, "wb") as f:
            f.write(await image.read())
        image_url = f"/{filename}"

    # Create Product object
    product_data = schemas.ProductCreate(
        name=name,
        price=price,
        description=description,
        quantity=quantity,
        image_url=image_url or "",
    )

    db_product = crud.create_product(db, product_data, image_url=image_url)
    return db_product


@router.get("/products/", response_model=list[schemas.Product])
def read_products(db: Session = Depends(get_db), limit: int = 10, offset: int = 0):
    return crud.get_all_products(db, limit=limit, offset=offset, request=None)


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


@router.post("/products/{product_id}/upload-image/", response_model=schemas.Product)
def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_admin),
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    upload_dir = "static/images/"
    os.makedirs(upload_dir, exist_ok=True)
    file_location = os.path.join(upload_dir, f"product_{product_id}_{file.filename}")

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    product.image_url = file_location
    db.commit()
    db.refresh(product)

    return product
