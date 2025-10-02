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

    class Config:
        orm_mode = True
