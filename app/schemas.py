from pydantic import BaseModel
from typing import List, Optional


class productBase(BaseModel):
    name: str
    price: float
    quantity: int


class ProductCreate(productBase):
    pass


class OrderBase(BaseModel):
    product_id: int
    quantity: int
    code: str
