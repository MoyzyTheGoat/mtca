# auth.py
import os
import uuid
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError, ExpiredSignatureError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import crud, models
from .database import get_db
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN_SECRET_KEY = os.getenv("ACCESS_TOKEN_SECRET_KEY")
REFRESH_TOKEN_SECRET_KEY = os.getenv("REFRESH_TOKEN_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


# ========================
# 🔑 TOKEN CREATION
# ========================
def _now_utc():
    return datetime.now(timezone.utc)


def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create a short-lived access token with standard claims + unique JTI."""
    to_encode = data.copy()
    now = _now_utc()
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    jti = str(uuid.uuid4())
    to_encode.update(
        {
            "exp": expire,
            "iat": now,
            "jti": jti,
            "aud": "mtca",  # optional audience to help validation across services
        }
    )
    token = jwt.encode(to_encode, ACCESS_TOKEN_SECRET_KEY, algorithm=ALGORITHM)
    return token


def create_refresh_token(data: dict, expires_delta: timedelta = None):
    """Create a long-lived refresh token with unique JTI."""
    now = _now_utc()
    expire = now + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    jti = str(uuid.uuid4())
    to_encode = data.copy()
    to_encode.update({"exp": expire, "iat": now, "jti": jti, "aud": "mtca-refresh"})
    return jwt.encode(to_encode, REFRESH_TOKEN_SECRET_KEY, algorithm=ALGORITHM)


# ========================
# 🚫 TOKEN REVOCATION (BLACKLIST)
# ========================


def revoke_token(db: Session, jti: str, reason: str = "logout"):
    """Add the token JTI to the RevokedToken table. idempotent."""
    if not db.query(models.RevokedToken).filter_by(jti=jti).first():
        revoked = models.RevokedToken(jti=jti, reason=reason)
        db.add(revoked)
        db.commit()


def is_token_revoked(db: Session, jti: str) -> bool:
    """Return True if JTI is present in revoked table."""
    return db.query(models.RevokedToken).filter_by(jti=jti).first() is not None


# ========================
# 🔍 TOKEN DECODING HELPERS
# ========================


# auth.py (replace existing _decode)
def _decode(token: str, secret: str, algorithms=None, audience: str | None = None):
    """Low-level decode helper that raises HTTPException on errors.

    If `audience` is provided, it will be verified against the token's `aud` claim.
    """
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=algorithms or [ALGORITHM],
            audience=audience,
        )
        return payload
    except ExpiredSignatureError as e:
        print("JWT Expired:", e)  # temp debug
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired"
        )
    except JWTError as e:
        print("JWT Decode error:", e)  # temp debug
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )


def decode_refresh_token(token: str, db: Session):
    """
    Decode and validate a refresh token.
    - verifies signature & expiration
    - checks for jti and sub claims
    - checks blacklist
    Returns payload on success or raises HTTPException.
    """
    payload = _decode(token, REFRESH_TOKEN_SECRET_KEY)
    username = payload.get("sub")
    jti = payload.get("jti")
    if username is None or jti is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    if is_token_revoked(db, jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )
    return payload


# ========================
# 🧍 AUTH DEPENDENCIES
# ========================


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # decode access token using access secret
    # inside get_current_user

    try:
        payload = _decode(token, ACCESS_TOKEN_SECRET_KEY, audience="mtca")
    except HTTPException:
        raise credentials_exception

    username: str = payload.get("sub")
    jti: str = payload.get("jti")

    if username is None or jti is None:
        raise credentials_exception

    # blacklist check
    if is_token_revoked(db, jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked"
        )

    user = crud.get_user_by_username(db, username)
    if user is None:
        raise credentials_exception
    return user


def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")
    return current_user
