"""Pydantic v2 models. Each has a hand-written TS mirror in frontend/src/lib/types.ts."""
import re
import uuid
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


def _uid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------- auth / user / business ----------
class UserPublic(BaseModel):
    id: str
    email: str
    business_name: Optional[str] = None
    owner_name: Optional[str] = None
    segment: Optional[str] = None
    phone: Optional[str] = None
    pix_key: Optional[str] = None
    onboarded: bool = False


class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordInput(BaseModel):
    email: EmailStr


class ResetPasswordInput(BaseModel):
    email: EmailStr
    token: str
    password: str = Field(min_length=6)


class ResetTokenOut(BaseModel):
    token: str
    message: str


class OnboardingInput(BaseModel):
    business_name: str = Field(min_length=1)
    owner_name: str = Field(min_length=1)
    segment: str = Field(min_length=1)
    # Optional on purpose: a blank phone must never block finishing the onboarding.
    phone: str = ""

    @field_validator("business_name", "owner_name", "segment", "phone", mode="before")
    @classmethod
    def _clean(cls, v: object) -> str:
        return str(v).strip() if v is not None else ""


class SettingsInput(BaseModel):
    """Business/settings block editable from /app/configuracoes."""

    business_name: str = Field(min_length=1)
    owner_name: str = Field(min_length=1)
    segment: str = Field(min_length=1)
    phone: str = ""
    pix_key: str = ""


class MessageOut(BaseModel):
    message: str


# ---------- clients ----------
class ClientBase(BaseModel):
    name: str = Field(min_length=1)
    phone: str = ""
    whatsapp: str = ""
    email: str = ""
    service: str = ""
    plan_value: float = 0
    next_due_date: str  # ISO yyyy-mm-dd
    status: str = "ativo"  # stored flag: ativo | inativo
    notes: str = ""

    @field_validator("phone", "whatsapp", "email", "service", "notes", mode="before")
    @classmethod
    def _blank_string(cls, v: object) -> str:
        """A cleared optional input arrives as null/undefined — treat it as empty, not an error."""
        return "" if v is None else str(v).strip()

    @field_validator("name", mode="before")
    @classmethod
    def _clean_name(cls, v: object) -> str:
        return str(v).strip() if v is not None else ""

    @field_validator("plan_value", mode="before")
    @classmethod
    def _coerce_value(cls, v: object) -> float:
        """Accept null, "", "150,50" (pt-BR comma) and "R$ 150,50" without 422-ing."""
        if v is None or v == "":
            return 0.0
        if isinstance(v, (int, float)):
            return float(v)
        cleaned = re.sub(r"[^\d,.\-]", "", str(v))
        if cleaned.count(",") and cleaned.count("."):
            cleaned = cleaned.replace(".", "").replace(",", ".")
        else:
            cleaned = cleaned.replace(",", ".")
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    @field_validator("status", mode="before")
    @classmethod
    def _clean_status(cls, v: object) -> str:
        value = str(v).strip().lower() if v is not None else "ativo"
        return value if value in {"ativo", "inativo"} else "ativo"

    @field_validator("next_due_date", mode="before")
    @classmethod
    def _clean_due(cls, v: object) -> str:
        """Empty date falls back to today rather than rejecting the whole save."""
        raw = str(v).strip() if v is not None else ""
        if not raw:
            return datetime.now(timezone.utc).date().isoformat()
        return raw[:10]


class ClientCreate(ClientBase):
    pass


class Client(ClientBase):
    id: str = Field(default_factory=_uid)
    user_id: str
    created_at: datetime = Field(default_factory=_now)
    # Derived server-side from next_due_date vs. today — never stored.
    situation: str = "ativo"  # ativo | vencendo_hoje | vence_em_breve | vencido | inativo
    days: int = 0


# ---------- payments ----------
class PaymentCreate(BaseModel):
    client_id: str
    amount: float
    method: str = "pix"  # pix | dinheiro | cartao | transferencia | outro
    paid_at: Optional[str] = None  # defaults to today
    notes: str = ""
    advance_due_date: bool = True

    _coerce_amount = field_validator("amount", mode="before")(
        ClientBase._coerce_value.__func__  # reuse the pt-BR tolerant number parser
    )

    @field_validator("notes", mode="before")
    @classmethod
    def _blank_notes(cls, v: object) -> str:
        return "" if v is None else str(v).strip()


class PaymentUpdate(BaseModel):
    amount: float
    method: str = "pix"
    paid_at: str
    notes: str = ""

    _coerce_amount = field_validator("amount", mode="before")(
        ClientBase._coerce_value.__func__
    )

    @field_validator("notes", mode="before")
    @classmethod
    def _blank_notes(cls, v: object) -> str:
        return "" if v is None else str(v).strip()


class Payment(BaseModel):
    id: str = Field(default_factory=_uid)
    user_id: str
    client_id: str
    client_name: str
    amount: float
    method: str = "pix"
    paid_at: str  # ISO yyyy-mm-dd
    notes: str = ""
    created_at: datetime = Field(default_factory=_now)


# ---------- charge log (histórico de cobranças) ----------
class ChargeCreate(BaseModel):
    kind: str = "lembrete"  # lembrete | vencido
    message: str = ""
    channel: str = "whatsapp"


class Charge(BaseModel):
    id: str = Field(default_factory=_uid)
    user_id: str
    client_id: str
    kind: str = "lembrete"
    message: str = ""
    channel: str = "whatsapp"
    created_at: datetime = Field(default_factory=_now)


class ClientDetail(BaseModel):
    client: Client
    payments: list[Payment]
    charges: list[Charge]
    total_paid: float
    payments_count: int


# ---------- dashboard ----------
class DueItem(BaseModel):
    id: str
    name: str
    phone: str
    plan_value: float
    next_due_date: str
    days: int  # negative = overdue
    situation: str = "ativo"


class DashboardSummary(BaseModel):
    today: str
    clientes_ativos: int
    vencendo_hoje: int
    vencendo_em_breve: int
    vencidos: int
    faturamento_mes: float
    pagamentos_pendentes: float
    proximos_vencimentos: list[DueItem]
    clientes_atrasados: list[DueItem]
