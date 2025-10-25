# schemas.py
from pydantic import BaseModel, validator
from typing import Optional, List


# Product schemas
class ProductBase(BaseModel):
    name: str
    price: float
    description: Optional[str] = ""
    quantity: int
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    # Image is uploaded via form-data, so not included here
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    quantity: Optional[int] = None
    image_url: Optional[str] = None


class ProductResponse(ProductBase):
    id: int

    class Config:
        orm_mode = True


# Order schemas
class OrderCreate(BaseModel):
    product_id: int
    quantity: int

    @validator("quantity")
    def quantity_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be > 0")
        return v


class OrderList(BaseModel):
    items: List[OrderCreate]


class OrderItem(BaseModel):
    product_name: str
    quantity: int


class OrderDetail(BaseModel):
    code: str
    items: List[OrderItem]
    total: float
    collected: bool


class OrderResponse(OrderDetail):
    pass


# User schemas
class UserCreate(BaseModel):
    username: str
    password: str
    is_admin: bool = False


class UserResponse(BaseModel):
    id: int
    username: str
    is_admin: bool

    class Config:
        orm_mode = True


# Token schemas
class TokenRefreshRequest(BaseModel):
    refresh_token: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
