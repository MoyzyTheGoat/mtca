from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    price: float
    quantity: int


class OrderBase(BaseModel):
    items: str


class ProductCreate(ProductBase):
    pass


class OrderCreate(OrderBase):
    pass


class Product(ProductBase):
    id: int

    class Config:
        orm_mode = True


class Order(OrderBase):
    id: int
    code: str
    user_id: int

    class Config:
        orm_mode = True


class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    password: str
    is_admin: bool = False


class User(UserBase):
    id: int
    is_admin: bool

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str
