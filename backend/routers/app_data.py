"""/api/clients, /api/payments, /api/dashboard — all scoped to the session user."""
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import current_user
from lib.db import db
from models.schemas import (
    Client,
    ClientCreate,
    DashboardSummary,
    DueItem,
    MessageOut,
    Payment,
    PaymentCreate,
)

router = APIRouter(tags=["app"])


def _today() -> date:
    return datetime.now(timezone.utc).date()


def _parse(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return _today()


def _add_month(d: date) -> date:
    month = d.month + 1
    year = d.year + (1 if month > 12 else 0)
    month = 1 if month > 12 else month
    day = d.day
    while day > 1:
        try:
            return date(year, month, day)
        except ValueError:
            day -= 1
    return date(year, month, 1)


# ---------- clients ----------
@router.get("/clients", response_model=list[Client])
async def list_clients(user: dict = Depends(current_user)):
    docs = await db.clients.find({"user_id": user["id"]}).to_list(1000)
    docs.sort(key=lambda d: d.get("next_due_date", ""))
    return [Client(**d) for d in docs]


@router.post("/clients", response_model=Client, status_code=201)
async def create_client(payload: ClientCreate, user: dict = Depends(current_user)):
    obj = Client(**payload.model_dump(), user_id=user["id"])
    await db.clients.insert_one(obj.model_dump())
    return obj


@router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, user: dict = Depends(current_user)):
    doc = await db.clients.find_one({"id": client_id, "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return Client(**doc)


@router.put("/clients/{client_id}", response_model=Client)
async def update_client(
    client_id: str, payload: ClientCreate, user: dict = Depends(current_user)
):
    doc = await db.clients.find_one({"id": client_id, "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    await db.clients.update_one({"id": client_id}, {"$set": payload.model_dump()})
    return Client(**{**doc, **payload.model_dump()})


@router.delete("/clients/{client_id}", response_model=MessageOut)
async def delete_client(client_id: str, user: dict = Depends(current_user)):
    result = await db.clients.delete_one({"id": client_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return MessageOut(message="Cliente excluído")


# ---------- payments ----------
@router.get("/payments", response_model=list[Payment])
async def list_payments(user: dict = Depends(current_user)):
    docs = await db.payments.find({"user_id": user["id"]}).to_list(1000)
    docs.sort(key=lambda d: d.get("paid_at", ""), reverse=True)
    return [Payment(**d) for d in docs]


@router.post("/payments", response_model=Payment, status_code=201)
async def create_payment(payload: PaymentCreate, user: dict = Depends(current_user)):
    client = await db.clients.find_one({"id": payload.client_id, "user_id": user["id"]})
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    obj = Payment(
        user_id=user["id"],
        client_id=payload.client_id,
        client_name=client["name"],
        amount=payload.amount,
        method=payload.method,
        paid_at=_today().isoformat(),
    )
    await db.payments.insert_one(obj.model_dump())
    # Registering a payment rolls the client's due date one month forward.
    new_due = _add_month(_parse(client.get("next_due_date", "")))
    await db.clients.update_one(
        {"id": payload.client_id}, {"$set": {"next_due_date": new_due.isoformat()}}
    )
    return obj


# ---------- dashboard ----------
@router.get("/dashboard", response_model=DashboardSummary)
async def dashboard(user: dict = Depends(current_user)):
    today = _today()
    clients = await db.clients.find({"user_id": user["id"]}).to_list(1000)
    payments = await db.payments.find({"user_id": user["id"]}).to_list(1000)

    active = [c for c in clients if c.get("status", "ativo") == "ativo"]
    items: list[DueItem] = []
    for c in active:
        due = _parse(c.get("next_due_date", ""))
        items.append(
            DueItem(
                id=c["id"],
                name=c.get("name", ""),
                phone=c.get("phone", "") or "",
                plan_value=float(c.get("plan_value", 0) or 0),
                next_due_date=due.isoformat(),
                days=(due - today).days,
            )
        )

    vencendo_hoje = [i for i in items if i.days == 0]
    em_breve = [i for i in items if 0 < i.days <= 7]
    vencidos = [i for i in items if i.days < 0]

    month_prefix = today.strftime("%Y-%m")
    faturamento = sum(
        float(p.get("amount", 0) or 0)
        for p in payments
        if str(p.get("paid_at", "")).startswith(month_prefix)
    )
    pendentes = sum(i.plan_value for i in vencendo_hoje + vencidos)

    proximos = sorted(
        [i for i in items if i.days >= 0], key=lambda i: i.next_due_date
    )[:6]
    atrasados = sorted(vencidos, key=lambda i: i.days)[:6]

    return DashboardSummary(
        today=today.isoformat(),
        clientes_ativos=len(active),
        vencendo_hoje=len(vencendo_hoje),
        vencendo_em_breve=len(em_breve),
        vencidos=len(vencidos),
        faturamento_mes=round(faturamento, 2),
        pagamentos_pendentes=round(pendentes, 2),
        proximos_vencimentos=proximos,
        clientes_atrasados=atrasados,
    )
