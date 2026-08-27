"""Covers: real-account signup -> onboarding -> logout -> login -> session persists.

Mirrors criteria 1, 2, 3 of the acceptance matrix at the API layer: a freshly
registered account must be able to log back in and /api/auth/session must keep
returning the user (the httpOnly cp_session cookie is the only auth mechanism).
"""
import os
import time

import httpx

# The session cookie is issued with Secure=True whenever APP_URL is https (see
# lib/auth.py create_session). A plain httpx client talking to localhost:8001
# over HTTP will never re-attach that cookie -- exactly like a browser would
# refuse to. Real users always go through the https ingress, so that is the
# URL these tests must exercise to match production behaviour.
APP_URL = os.environ.get("APP_URL", "http://localhost:8001")
BASE = f"{APP_URL}/api" if APP_URL.startswith("https") else "http://localhost:8001/api"


def _unique_email() -> str:
    return f"tscheck-signup-{int(time.time() * 1000)}@example.com"


def test_register_onboarding_logout_login_session_roundtrip():
    email = _unique_email()
    password = "senha123"

    with httpx.Client(base_url=BASE, timeout=30.0) as c:
        # 1. register -> creates session cookie, onboarded=False
        r = c.post("/auth/register", json={"email": email, "password": password})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["email"] == email
        assert body["onboarded"] is False

        # 2. complete onboarding while session cookie from register is still set
        r = c.post(
            "/auth/onboarding",
            json={
                "business_name": "tscheck Studio",
                "owner_name": "Tester QA",
                "segment": "Consultoria",
                "phone": "11999999999",
            },
        )
        assert r.status_code == 200, r.text
        assert r.json()["onboarded"] is True

        # 3. logout destroys the session
        r = c.post("/auth/logout")
        assert r.status_code == 200, r.text

        r = c.get("/auth/session")
        assert r.status_code == 200
        assert r.json() is None, "session should be cleared after logout"

        # 4. log back in with the same real credentials
        r = c.post("/auth/login", json={"email": email, "password": password})
        assert r.status_code == 200, r.text
        assert r.json()["email"] == email

        # 5. session probe must now return the authenticated user (not None) —
        # this is exactly the bug reported by the user: login accepted but the
        # session does not stick.
        r = c.get("/auth/session")
        assert r.status_code == 200, r.text
        session_user = r.json()
        assert session_user is not None, "session dropped right after login"
        assert session_user["email"] == email
        assert session_user["owner_name"] == "Tester QA"

        # 6. a protected endpoint must also work with the same cookie jar
        r = c.get("/dashboard")
        assert r.status_code == 200, r.text


def test_login_wrong_password_rejected():
    email = _unique_email()
    password = "senha123"
    with httpx.Client(base_url=BASE, timeout=30.0) as c:
        r = c.post("/auth/register", json={"email": email, "password": password})
        assert r.status_code == 200, r.text
        c.post("/auth/logout")

        r = c.post("/auth/login", json={"email": email, "password": "wrongpass"})
        assert r.status_code == 401, r.text
