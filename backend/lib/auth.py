"""Auth helpers: password hashing, opaque session tokens, current-user dependency."""
import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, Response

from lib.db import db

SESSION_COOKIE = "cp_session"
SESSION_DAYS = 30
_ITERATIONS = 120_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _ITERATIONS)
    return f"{salt}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, expected = stored.split("$", 1)
    except ValueError:
        return False
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _ITERATIONS)
    return secrets.compare_digest(dk.hex(), expected)


async def create_session(user_id: str, response: Response) -> str:
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
    await db.sessions.insert_one(
        {"token": token, "user_id": user_id, "expires_at": expires}
    )
    secure = os.environ.get("APP_URL", "").startswith("https")
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_DAYS * 24 * 3600,
        httponly=True,
        samesite="lax",
        secure=secure,
        path="/",
    )
    return token


async def destroy_session(request: Request, response: Response) -> None:
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        await db.sessions.delete_many({"token": token})
    response.delete_cookie(SESSION_COOKIE, path="/")


async def optional_user(request: Request) -> Optional[dict]:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    session = await db.sessions.find_one({"token": token})
    if not session:
        return None
    now = datetime.now(timezone.utc)
    expires = session.get("expires_at")
    if isinstance(expires, datetime):
        # BSON hands back naive datetimes; normalise before comparing against an aware now.
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < now:
            await db.sessions.delete_many({"token": token})
            return None
        # Sliding window: an actively used session keeps renewing so it never expires
        # under the user while they are working.
        if expires - now < timedelta(days=SESSION_DAYS - 1):
            await db.sessions.update_one(
                {"token": token},
                {"$set": {"expires_at": now + timedelta(days=SESSION_DAYS)}},
            )
    user = await db.users.find_one({"id": session["user_id"]})
    return user


async def current_user(user: Optional[dict] = Depends(optional_user)) -> dict:
    if not user:
        raise HTTPException(status_code=401, detail="Não autenticado")
    return user
