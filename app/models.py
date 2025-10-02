from sqlalchemy import Integer, Column, String, Float, ForeignKey
from .database import Base
from sqlalchemy.orm import relationship


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
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("Users", back_populates="orders")


class Users(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
