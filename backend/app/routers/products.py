# routers/products.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import shutil, os
from .. import crud, schemas, auth
from ..database import get_db
from fastapi import Body


router = APIRouter(tags=["Products"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(os.path.dirname(BASE_DIR), "static")
IMAGES_DIR = os.path.join(STATIC_DIR, "images")
os.makedirs(IMAGES_DIR, exist_ok=True)


@router.get("/", response_model=list[schemas.ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return crud.get_all_products(db)


@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post(
    "/",
    response_model=schemas.ProductResponse,
    dependencies=[Depends(auth.get_current_admin)],
)
async def create_product(
    name: str = Form(...),
    price: float = Form(...),
    quantity: int = Form(...),
    description: str = Form(""),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    image_url = None
    if image:
        # Save to the same static/images directory used in main.py
        file_path = os.path.join(IMAGES_DIR, image.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"/static/images/{image.filename}"

    product_data = {
        "name": name,
        "price": float(price),
        "quantity": int(quantity),
        "description": description,
        "image_url": image_url,
    }

    product = crud.create_product(db, product_data)
    return product


@router.patch(
    "/{product_id}",
    response_model=schemas.ProductResponse,
    dependencies=[Depends(auth.get_current_admin)],
)
def update_product_endpoint(
    product_id: int,
    update_data: schemas.ProductUpdate = Body(...),
    db: Session = Depends(get_db),
):
    """
    Update product fields. All fields are optional in ProductUpdate.
    Requires admin.
    """
    product = crud.update_product(db, product_id, update_data)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.patch(
    "/{product_id}/image",
    response_model=schemas.ProductResponse,
    dependencies=[Depends(auth.get_current_admin)],
)
def update_product_image(
    product_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # implement file save logic (e.g. write to /static/uploads/ and set product.image_url)
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # example saving - adjust path and URL composition to your app
    filename = f"/uploads/{product_id}-{image.filename}"
    with open(f"./static{filename}", "wb") as f:
        f.write(image.file.read())

    product.image_url = filename
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", dependencies=[Depends(auth.get_current_admin)])
def delete_product_endpoint(product_id: int, db: Session = Depends(get_db)):
    """
    Delete a product (admin only).
    Returns a simple JSON message on success, 404 if not found.
    """
    product = crud.delete_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    return {"message": "Product deleted"}
