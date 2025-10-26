# routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt, JWTError

from .. import crud, schemas, auth, models
from ..database import get_db

router = APIRouter(tags=["Users"])  # no prefix


@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    if user.is_admin:
        raise HTTPException(status_code=403, detail="Cannot self-assign admin role")
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    new_user = crud.create_user(db, user.username, user.password, user.is_admin)
    return new_user


@router.post("/login", response_model=schemas.LoginResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create tokens
    access_token = auth.create_access_token({"sub": user.username})
    refresh_token = auth.create_refresh_token({"sub": user.username})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=schemas.LoginResponse)
def refresh_token(req: schemas.TokenRefreshRequest, db: Session = Depends(get_db)):
    """
    Rotate refresh tokens:
    - Validate incoming refresh token
    - Revoke the old refresh token (so it can't be reused)
    - Issue a new access token and refresh token
    """
    try:
        payload = auth.decode_refresh_token(req.refresh_token, db)
        username: str = payload.get("sub")
        old_jti: str = payload.get("jti")

        # revoke the old refresh token (token rotation)
        auth.revoke_token(db, old_jti, reason="refresh_rotation")

        # generate new tokens
        access_token = auth.create_access_token({"sub": username})
        refresh_token = auth.create_refresh_token({"sub": username})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }
    except HTTPException as e:
        # bubble up HTTP errors (invalid/expired/revoked)
        raise e
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return current_user


from jose import jwt


@router.post("/logout")
def logout(
    token: str = Depends(auth.oauth2_scheme),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Invalidate the current access token (blacklist by jti)."""
    try:
        payload = jwt.decode(
            token, auth.ACCESS_TOKEN_SECRET_KEY, algorithms=[auth.ALGORITHM]
        )
        jti = payload.get("jti")
        if not jti:
            raise HTTPException(status_code=400, detail="Invalid token")
        auth.revoke_token(db, jti, reason="logout")
        return {"detail": "Successfully logged out"}
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid token")
