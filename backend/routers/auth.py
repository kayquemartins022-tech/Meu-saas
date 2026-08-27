"""/api/auth/* — email+password sessions on httpOnly cookies."""
import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from lib.auth import (
    create_session,
    current_user,
    destroy_session,
    hash_password,
    optional_user,
    verify_password,
)
from lib.db import db
from models.schemas import (
    ForgotPasswordInput,
    LoginInput,
    MessageOut,
    OnboardingInput,
    RegisterInput,
    ResetPasswordInput,
    ResetTokenOut,
    SettingsInput,
    UserPublic,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _public(user: dict) -> UserPublic:
    return UserPublic(
        id=user["id"],
        email=user["email"],
        business_name=user.get("business_name"),
        owner_name=user.get("owner_name"),
        segment=user.get("segment"),
        phone=user.get("phone"),
        pix_key=user.get("pix_key"),
        onboarded=bool(user.get("onboarded", False)),
    )


@router.post("/register", response_model=UserPublic)
async def register(payload: RegisterInput, response: Response):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado")
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(payload.password),
        "business_name": None,
        "owner_name": None,
        "segment": None,
        "phone": None,
        "onboarded": False,
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(dict(user))
    await create_session(user["id"], response)
    return _public(user)


@router.post("/login", response_model=UserPublic)
async def login(payload: LoginInput, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
    await create_session(user["id"], response)
    return _public(user)


@router.post("/logout", response_model=MessageOut)
async def logout(request: Request, response: Response):
    await destroy_session(request, response)
    return MessageOut(message="Sessão encerrada")


@router.get("/me", response_model=UserPublic)
async def me(user: dict = Depends(current_user)):
    return _public(user)


@router.get("/session", response_model=UserPublic | None)
async def session(user: dict | None = Depends(optional_user)):
    """Non-throwing probe used by the frontend to decide auth state."""
    return _public(user) if user else None


@router.post("/forgot-password", response_model=ResetTokenOut)
async def forgot_password(payload: ForgotPasswordInput):
    """MOCKED recovery: no e-mail is sent, the token is returned directly."""
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="E-mail não encontrado")
    token = secrets.token_hex(3).upper()
    await db.reset_tokens.delete_many({"email": email})
    await db.reset_tokens.insert_one(
        {"email": email, "token": token, "created_at": datetime.now(timezone.utc)}
    )
    return ResetTokenOut(
        token=token,
        message="Código de recuperação gerado. Use-o para definir uma nova senha.",
    )


@router.post("/reset-password", response_model=MessageOut)
async def reset_password(payload: ResetPasswordInput):
    email = payload.email.lower().strip()
    record = await db.reset_tokens.find_one(
        {"email": email, "token": payload.token.strip().upper()}
    )
    if not record:
        raise HTTPException(status_code=400, detail="Código inválido")
    await db.users.update_one(
        {"email": email}, {"$set": {"password_hash": hash_password(payload.password)}}
    )
    await db.reset_tokens.delete_many({"email": email})
    return MessageOut(message="Senha redefinida com sucesso")


@router.post("/onboarding", response_model=UserPublic)
async def complete_onboarding(payload: OnboardingInput, user: dict = Depends(current_user)):
    updates = payload.model_dump()
    updates["onboarded"] = True
    await db.users.update_one({"id": user["id"]}, {"$set": updates})
    return _public({**user, **updates})


@router.put("/settings", response_model=UserPublic)
async def update_settings(payload: SettingsInput, user: dict = Depends(current_user)):
    updates = payload.model_dump()
    await db.users.update_one({"id": user["id"]}, {"$set": updates})
    return _public({**user, **updates})
