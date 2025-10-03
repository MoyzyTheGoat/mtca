from pydantic import BaseModel, conint
from typing import List, Optional


class ProductCreate(BaseModel):
    name: str
    price: float
    stock: int


class ProductOut(BaseModel):
    id: int
    name: str
    price: float
    stock: int

    class Config:
        orm_mode = True


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]


class OrderItemOut(BaseModel):
    product_id: int
    quantity: int
    price_at_order: float

    class Config:
        orm_mode = True


class OrderOut(BaseModel):
    id: int
    code: str
    picked_up: bool
    items: List[OrderItemOut]

    class Config:
        orm_mode = True
