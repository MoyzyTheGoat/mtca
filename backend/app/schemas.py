# schemas.py
from datetime import datetime
from pydantic import BaseModel, validator
from typing import Optional, List


# ---------- Product Schemas ----------
class ProductBase(BaseModel):
    name: str
    price: float
    description: Optional[str] = ""
    quantity: int
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
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


# ---------- Order Schemas ----------
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


# richer order item so frontend can compute totals when available
class OrderItem(BaseModel):
    product_name: str
    quantity: int
    # optional fields that may be present depending on the endpoint
    price: Optional[float] = None
    subtotal: Optional[float] = None


# Small user summary for including in order responses
class UserSimple(BaseModel):
    id: int
    username: str

    class Config:
        orm_mode = True


class OrderDetail(BaseModel):
    code: str
    items: List[OrderItem]
    total: float
    collected: bool
    # optional: who placed the order (username + id)
    user: Optional[UserSimple] = None
    # optional created timestamp for grouped orders if you return it
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class OrderResponse(OrderDetail):
    pass


# ---------- Per-row user-facing response (if used) ----------
class UserOrderResponse(BaseModel):
    id: int
    code: str
    quantity: int
    collected: bool
    product: ProductResponse
    created_at: datetime

    class Config:
        orm_mode = True


# ---------- User / Auth Schemas ----------
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


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
