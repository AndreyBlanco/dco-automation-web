from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import Literal
import base64
import hashlib
import hmac
import json
import os
import secrets

from fastapi import Depends, Header, HTTPException, status
from pydantic import BaseModel

UserRole = Literal["admin", "operator"]


class LoginRequest(BaseModel):
    username: str
    password: str

class UserPublic(BaseModel):
    id: str
    username: str
    email: str
    name: str
    role: UserRole


class LoginResponse(BaseModel):
    accessToken: str
    user: UserPublic


# Demo users for class project only.
# Passwords:
# admin@dco.test / admin123
# operator@dco.test / operator123
_USERS = {
    "admin@dco.test": {
        "id": "user-admin",
        "email": "admin@dco.test",
        "name": "DCO Admin",
        "role": "admin",
        "password_hash": hashlib.sha256("admin123".encode()).hexdigest(),
    },
    "operator@dco.test": {
        "id": "user-operator",
        "email": "operator@dco.test",
        "name": "DCO Operator",
        "role": "operator",
        "password_hash": hashlib.sha256("operator123".encode()).hexdigest(),
    },
}


def _secret_key() -> str:
    return os.getenv("AUTH_SECRET_KEY", "dev-secret-key-change-before-production")


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _sign(payload_b64: str) -> str:
    signature = hmac.new(
        _secret_key().encode(),
        payload_b64.encode(),
        hashlib.sha256,
    ).digest()
    return _b64url_encode(signature)


def create_token(user: dict, minutes: int = 8 * 60) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "exp": int(expires_at.timestamp()),
        "nonce": secrets.token_hex(8),
    }
    payload_b64 = _b64url_encode(json.dumps(payload).encode())
    signature = _sign(payload_b64)
    return f"{payload_b64}.{signature}"


def verify_token(token: str) -> UserPublic:
    try:
        payload_b64, signature = token.split(".", 1)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    expected = _sign(payload_b64)
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature")

    try:
        payload = json.loads(_b64url_decode(payload_b64))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload") from exc

    if int(payload.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    return UserPublic(
    id=payload["sub"],
    username=payload["email"],
    email=payload["email"],
    name=payload["name"],
    role=payload["role"],
)


def authenticate(username: str, password: str) -> LoginResponse:
    normalized_email = username.strip().lower()
    user = _USERS.get(normalized_email)

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    password_hash = hashlib.sha256(password.encode()).hexdigest()
    if not hmac.compare_digest(password_hash, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    public_user = UserPublic(
        id=user["id"],
        username=user["email"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
  )
    return LoginResponse(accessToken=create_token(user), user=public_user)


def get_current_user(authorization: str | None = Header(default=None, alias="Authorization")) -> UserPublic: 
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization token")

    token = authorization.split(" ", 1)[1].strip()
    return verify_token(token)


def require_admin(user: UserPublic = Depends(get_current_user)) -> UserPublic:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return user
