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
    # snapshot/legacy fields:
    price: Optional[float] = None  # unit price at purchase (keeps old field name)
    subtotal: Optional[float] = None  # line total (keeps old field name)

    # explicit snapshot names (optional; may be present depending on endpoint)
    unit_price: Optional[float] = None
    line_total: Optional[float] = None


# Small user summary for including in order responses
class UserSimple(BaseModel):
    id: int
    username: str

    class Config:
        orm_mode = True


class OrderDetail(BaseModel):
    code: str
    items: List[OrderItem]
    total: float  # legacy field used by frontend (sum of subtotals)
    collected: bool
    user: Optional[UserSimple] = None
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class OrderResponse(OrderDetail):
    pass


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
