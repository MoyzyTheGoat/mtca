from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from .. import crud, schemas, auth, models
from ..database import get_db
import os
import shutil
import uuid

router = APIRouter(tags=["products"])

# === Directories ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static", "images")
os.makedirs(STATIC_DIR, exist_ok=True)


# ==============================
# 🟩 CREATE PRODUCT
# ==============================
@router.post("/", response_model=schemas.Product)
async def create_product(
    name: str = Form(...),
    price: float = Form(...),
    quantity: int = Form(0),
    description: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin),
):
    # ✅ generate unique filename
    ext = os.path.splitext(image.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(STATIC_DIR, filename)

    # ✅ save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # ✅ save product entry
    image_url = f"/static/images/{filename}"
    new_product = models.Product(
        name=name,
        price=price,
        quantity=quantity,
        description=description,
        image_url=image_url,
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


# ==============================
# 🟩 READ PRODUCTS
# ==============================
@router.get("/", response_model=list[schemas.Product])
def read_products(db: Session = Depends(get_db), limit: int = 10, offset: int = 0):
    return crud.get_all_products(db, limit=limit, offset=offset, request=None)


# ==============================
# 🟩 UPDATE PRODUCT
# ==============================
@router.put("/{product_id}", response_model=schemas.Product)
async def update_product(
    product_id: int,
    name: str = Form(...),
    price: float = Form(...),
    quantity: int = Form(...),
    description: str = Form(...),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # ✅ update basic fields
    product.name = name
    product.price = price
    product.quantity = quantity
    product.description = description

    # ✅ if new image uploaded, replace it
    if image:
        ext = os.path.splitext(image.filename)[1]
        filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(STATIC_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        product.image_url = f"/static/images/{filename}"

    db.commit()
    db.refresh(product)
    return product


# ==============================
# 🟩 DELETE PRODUCT
# ==============================
@router.delete("/{product_id}", response_model=schemas.Product)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(auth.get_current_admin),
):
    db_product = crud.delete_product(db, product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product


# ==============================
# 🟩 GET SINGLE PRODUCT
# ==============================
@router.get("/{product_id}", response_model=schemas.Product)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ==============================
# 🟩 UPLOAD IMAGE SEPARATELY (optional)
# ==============================
@router.post("/{product_id}/upload-image/", response_model=schemas.Product)
def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin=Depends(auth.get_current_admin),
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(STATIC_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    product.image_url = f"/static/images/{filename}"

    db.commit()
    db.refresh(product)
    return product
