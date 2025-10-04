import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app import crud, schemas

# In-memory SQLite DB for isolated tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Override get_db to use test DB
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db):
    user_in = schemas.UserCreate(username="admin", password="admin123", is_admin=True)
    return crud.create_user(db, user_in)


@pytest.fixture
def regular_user(db):
    user_in = schemas.UserCreate(username="user", password="user123", is_admin=False)
    return crud.create_user(db, user_in)


@pytest.fixture
def admin_token(client, admin_user):
    resp = client.post(
        "/login", data={"username": admin_user.username, "password": "admin123"}
    )
    return resp.json()["access_token"]


@pytest.fixture
def user_token(client, regular_user):
    resp = client.post(
        "/login", data={"username": regular_user.username, "password": "user123"}
    )
    return resp.json()["access_token"]
