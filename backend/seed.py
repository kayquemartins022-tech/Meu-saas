"""Idempotent demo seed: demo account with clients/payments + a second isolated account.

Run: cd /app/backend && python seed.py
"""
import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone

from lib.auth import hash_password
from lib.db import db

DEMO_EMAIL = "demo@clientepro.com"
DEMO_PASSWORD = "demo1234"
# Second account exists only to prove data isolation between users.
OTHER_EMAIL = "outro@clientepro.com"
OTHER_PASSWORD = "outro1234"

# name, phone, whatsapp, service, value, due offset (days), status
CLIENTS = [
    ("Academia Corpo Forte", "1133330001", "5511988880001", "Plano mensal Premium", 249.90, -12, "ativo"),
    ("Studio Bella Estética", "1133330002", "5511988880002", "Pacote de manutenção", 189.00, -4, "ativo"),
    ("Padaria Pão Nosso", "1133330003", "5511988880003", "Consultoria mensal", 129.90, 0, "ativo"),
    ("Consultório Dra. Helena", "1133330004", "5511988880004", "Sistema de agenda", 399.00, 0, "ativo"),
    ("Pet Shop Amigo Fiel", "1133330005", "5511988880005", "Gestão de redes sociais", 159.90, 3, "ativo"),
    ("Mercado Bom Preço", "1133330006", "5511988880006", "Suporte técnico", 299.00, 6, "ativo"),
    ("Barbearia Navalha", "1133330007", "5511988880007", "Plano básico", 99.90, 14, "ativo"),
    ("Escola Aprender Mais", "1133330008", "5511988880008", "Plano institucional", 549.00, 21, "ativo"),
    ("Oficina Motor Zero", "1133330009", "", "Plano mensal", 219.00, 9, "inativo"),
]

METHODS = ["pix", "dinheiro", "cartao", "transferencia", "pix"]


async def ensure_user(email: str, password: str, business: str, owner: str, pix: str) -> str:
    existing = await db.users.find_one({"email": email})
    if existing:
        return existing["id"]
    user_id = str(uuid.uuid4())
    await db.users.insert_one(
        {
            "id": user_id,
            "email": email,
            "password_hash": hash_password(password),
            "business_name": business,
            "owner_name": owner,
            "segment": "Serviços",
            "phone": "5511999990000",
            "pix_key": pix,
            "onboarded": True,
            "created_at": datetime.now(timezone.utc),
        }
    )
    return user_id


async def main() -> None:
    today = date.today()

    demo_id = await ensure_user(
        DEMO_EMAIL, DEMO_PASSWORD, "Studio Alpha Serviços", "Ana Beatriz Lima", "ana@studioalpha.com.br"
    )
    other_id = await ensure_user(
        OTHER_EMAIL, OTHER_PASSWORD, "Oficina Beta", "Bruno Costa", "bruno@beta.com.br"
    )

    for uid in (demo_id, other_id):
        await db.clients.delete_many({"user_id": uid})
        await db.payments.delete_many({"user_id": uid})
        await db.charges.delete_many({"user_id": uid})

    docs = []
    for name, phone, whatsapp, service, value, offset, status in CLIENTS:
        slug = name.lower().replace(" ", ".")
        docs.append(
            {
                "id": str(uuid.uuid4()),
                "user_id": demo_id,
                "name": name,
                "phone": phone,
                "whatsapp": whatsapp,
                "email": f"{slug}@exemplo.com",
                "service": service,
                "plan_value": value,
                "next_due_date": (today + timedelta(days=offset)).isoformat(),
                "status": status,
                "notes": "",
                "created_at": datetime.now(timezone.utc) - timedelta(days=60 + offset),
            }
        )
    await db.clients.insert_many(docs)

    payments = []
    for i, doc in enumerate(docs[:5]):
        payments.append(
            {
                "id": str(uuid.uuid4()),
                "user_id": demo_id,
                "client_id": doc["id"],
                "client_name": doc["name"],
                "amount": doc["plan_value"],
                "method": METHODS[i],
                "paid_at": today.replace(day=min(today.day, 5)).isoformat(),
                "notes": "Mensalidade do período anterior",
                "created_at": datetime.now(timezone.utc),
            }
        )
    await db.payments.insert_many(payments)

    # The other account gets a single client so isolation is visible in the UI.
    await db.clients.insert_one(
        {
            "id": str(uuid.uuid4()),
            "user_id": other_id,
            "name": "Cliente Exclusivo da Oficina Beta",
            "phone": "1144440001",
            "whatsapp": "5511977770001",
            "email": "beta@exemplo.com",
            "service": "Revisão mensal",
            "plan_value": 350.00,
            "next_due_date": (today + timedelta(days=2)).isoformat(),
            "status": "ativo",
            "notes": "",
            "created_at": datetime.now(timezone.utc),
        }
    )

    print(f"seeded {DEMO_EMAIL} / {DEMO_PASSWORD} with {len(docs)} clients, {len(payments)} payments")
    print(f"seeded {OTHER_EMAIL} / {OTHER_PASSWORD} with 1 client (isolation check)")


if __name__ == "__main__":
    asyncio.run(main())
