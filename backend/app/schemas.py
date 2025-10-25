from pydantic import BaseModel, validator
from typing import Optional, List


# PRODUCTS
class ProductBase(BaseModel):
    name: str
    price: float
    description: str = ""
    quantity: int
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    name: str
    price: float
    description: str = ""  # default empty string if optional
    image_url: str = ""  # optional if you handle image upload separately


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class Product(ProductBase):
    id: int

    class Config:
        orm_mode = True


# ORDERS
class OrderCreate(BaseModel):
    product_id: int
    quantity: int

    @validator("quantity")
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be greater than 0")
        return v


class OrderResponse(BaseModel):
    message: str
    code: str


class OrderUpdate(BaseModel):
    product_id: Optional[int] = None
    quantity: Optional[int] = None


class Order(BaseModel):
    id: int
    product_id: int
    quantity: int
    code: str
    collected: bool

    class Config:
        orm_mode = True


# USERS
class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str
    is_admin: bool = False


class UserResponse(UserBase):
    id: int
    is_admin: bool

    class Config:
        orm_mode = True


class TokenRefreshRequest(BaseModel):
    refresh_token: str
