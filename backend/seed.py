"""Idempotent demo seed: one demo account with clients + payments.

Run: cd /app/backend && python seed.py
"""
import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone

from lib.auth import hash_password
from lib.db import db

DEMO_EMAIL = "demo@clientepro.com"
DEMO_PASSWORD = "demo1234"

CLIENTS = [
    ("Academia Corpo Forte", "5511988880001", 249.90, -12, "ativo"),
    ("Studio Bella Estética", "5511988880002", 189.00, -4, "ativo"),
    ("Padaria Pão Nosso", "5511988880003", 129.90, 0, "ativo"),
    ("Consultório Dra. Helena", "5511988880004", 399.00, 0, "ativo"),
    ("Pet Shop Amigo Fiel", "5511988880005", 159.90, 3, "ativo"),
    ("Mercado Bom Preço", "5511988880006", 299.00, 6, "ativo"),
    ("Barbearia Navalha", "5511988880007", 99.90, 14, "ativo"),
    ("Escola Aprender Mais", "5511988880008", 549.00, 21, "ativo"),
    ("Oficina Motor Zero", "5511988880009", 219.00, 9, "inativo"),
]


async def main() -> None:
    today = date.today()
    user = await db.users.find_one({"email": DEMO_EMAIL})
    if user:
        user_id = user["id"]
    else:
        user_id = str(uuid.uuid4())
        await db.users.insert_one(
            {
                "id": user_id,
                "email": DEMO_EMAIL,
                "password_hash": hash_password(DEMO_PASSWORD),
                "business_name": "Studio Alpha Serviços",
                "owner_name": "Ana Beatriz Lima",
                "segment": "Serviços",
                "phone": "5511999990000",
                "onboarded": True,
                "created_at": datetime.now(timezone.utc),
            }
        )

    await db.clients.delete_many({"user_id": user_id})
    await db.payments.delete_many({"user_id": user_id})

    docs = []
    for name, phone, value, offset, status in CLIENTS:
        docs.append(
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "name": name,
                "phone": phone,
                "email": name.lower().replace(" ", ".").replace("ã", "a") + "@exemplo.com",
                "plan_value": value,
                "next_due_date": (today + timedelta(days=offset)).isoformat(),
                "status": status,
                "notes": "",
                "created_at": datetime.now(timezone.utc),
            }
        )
    await db.clients.insert_many(docs)

    payments = []
    for doc in docs[:5]:
        payments.append(
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "client_id": doc["id"],
                "client_name": doc["name"],
                "amount": doc["plan_value"],
                "method": "pix",
                "paid_at": today.replace(day=min(today.day, 5)).isoformat(),
                "created_at": datetime.now(timezone.utc),
            }
        )
    await db.payments.insert_many(payments)
    print(f"seeded demo user {DEMO_EMAIL} / {DEMO_PASSWORD} with {len(docs)} clients")


if __name__ == "__main__":
    asyncio.run(main())
