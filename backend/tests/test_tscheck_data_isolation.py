"""Covers criterion: data isolation — a freshly-registered account must see zero
clients/dashboard data of its own, while the seeded demo account keeps its 9 clients.

Uses the https APP_URL (real ingress path) because the session cookie is
Secure=True and will not be resent over a plain-http connection.
"""
import os
import time

import httpx

_APP_URL = os.environ.get("APP_URL", "http://localhost:8001")
BASE = f"{_APP_URL}/api" if _APP_URL.startswith("https") else "http://localhost:8001/api"


def _unique_email() -> str:
    return f"tscheck-isolation-{int(time.time() * 1000)}@example.com"


def test_new_account_has_no_clients_and_zero_dashboard():
    email = _unique_email()
    with httpx.Client(base_url=BASE, timeout=30.0) as c:
        r = c.post("/auth/register", json={"email": email, "password": "senha123"})
        assert r.status_code == 200, r.text

        r = c.get("/clients")
        assert r.status_code == 200, r.text
        assert r.json() == [], "brand-new account must start with zero clients"

        r = c.get("/dashboard")
        assert r.status_code == 200, r.text
        summary = r.json()
        assert summary["clientes_ativos"] == 0
        assert summary["vencidos"] == 0
        assert summary["proximos_vencimentos"] == []


def test_demo_account_keeps_its_own_nine_clients():
    with httpx.Client(base_url=BASE, timeout=30.0) as c:
        r = c.post(
            "/auth/login", json={"email": "demo@clientepro.com", "password": "demo1234"}
        )
        assert r.status_code == 200, r.text

        r = c.get("/clients")
        assert r.status_code == 200, r.text
        clients = r.json()
        assert len(clients) == 9, f"expected the seeded 9 demo clients, got {len(clients)}"
