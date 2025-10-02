from sqlalchemy import Integer, Column, String, Float, ForeignKey
from .database import Base


class Products(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    quantity = Column(Integer)


class Orders(Base):
    __tablename__ = "order"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    items = Column(String)
