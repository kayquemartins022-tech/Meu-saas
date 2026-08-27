"""Covers criterion: private routes must reject requests carrying no session cookie."""
import httpx

BASE = "http://localhost:8001/api"


def test_protected_endpoints_require_session():
    # fresh client with no cookie jar at all
    with httpx.Client(base_url=BASE, timeout=30.0) as c:
        for path in ["/dashboard", "/clients", "/payments", "/auth/me"]:
            r = c.get(path)
            assert r.status_code == 401, f"{path} should be 401 without a session, got {r.status_code}: {r.text}"


def test_session_probe_is_non_throwing_when_unauthenticated():
    """/api/auth/session is the non-throwing probe the frontend polls; unlike
    the other endpoints it must return 200 + null, never 401."""
    with httpx.Client(base_url=BASE, timeout=30.0) as c:
        r = c.get("/auth/session")
        assert r.status_code == 200, r.text
        assert r.json() is None
