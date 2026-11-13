import pytest
from fastapi.testclient import TestClient

from backend import main
from backend.security import COOKIE

DOMAIN = "https://datatlas.inteligencia-operacional.duckdns.org"


@pytest.fixture
def sessions(monkeypatch):
    monkeypatch.setenv("DATATLAS_PUBLIC_MODE", "true")
    monkeypatch.setenv("DATATLAS_ALLOWED_HOSTS", DOMAIN.removeprefix("https://"))
    monkeypatch.setenv("DATATLAS_ALLOWED_ORIGINS", DOMAIN)
    monkeypatch.setenv("DATATLAS_ACCESS_MODE", "session")
    monkeypatch.setenv("DATATLAS_SESSION_KEY", "test-only-session-secret-" * 4)
    monkeypatch.setenv("GEMINI_ENABLED", "false")
    main.STORE.clear()
    with TestClient(main.app, base_url=DOMAIN) as a, TestClient(main.app, base_url=DOMAIN) as b:
        yield a, b
    main.STORE.clear()


def test_no_password_and_secure_cookie(sessions):
    a, _ = sessions
    response = a.get("/")
    assert response.status_code == 200
    assert "www-authenticate" not in response.headers
    cookie = response.headers["set-cookie"]
    assert "Secure" in cookie and "HttpOnly" in cookie and "SameSite=strict" in cookie
    assert "Domain=" not in cookie


@pytest.mark.parametrize("operation", ["analyze", "ask", "report", "delete"])
def test_another_session_cannot_access_or_delete(sessions, operation):
    a, b = sessions
    key = a.post("/api/demo").json()["id"]
    if operation == "delete":
        response = b.delete(f"/api/datasets/{key}")
    else:
        body = {"question": "Quantas linhas?", "consent": False} if operation == "ask" else {}
        response = b.post(f"/api/datasets/{key}/{operation}", json=body)
    assert response.status_code == 404
    assert a.post(f"/api/datasets/{key}/analyze", json={}).status_code == 200


def test_missing_or_tampered_cookie_never_grants_access(sessions):
    a, b = sessions
    key = a.post("/api/demo").json()["id"]
    stolen_but_tampered = a.cookies.get(COOKIE)[:-1] + "z"
    b.cookies.set(COOKIE, stolen_but_tampered)
    assert b.post(f"/api/datasets/{key}/analyze", json={}).status_code == 404
    b.cookies.clear()
    assert b.post(f"/api/datasets/{key}/analyze", json={}).status_code == 404


def test_two_base_limit_per_session(sessions):
    a, b = sessions
    assert a.post("/api/demo").status_code == 200
    assert a.post("/api/demo").status_code == 200
    assert a.post("/api/demo").status_code == 429
    assert b.post("/api/demo").status_code == 200


def test_missing_session_secret_fails_closed(sessions, monkeypatch):
    a, _ = sessions
    monkeypatch.delenv("DATATLAS_SESSION_KEY")
    assert a.get("/").status_code == 503


def test_expired_signed_cookie_cannot_read_active_dataset(sessions, monkeypatch):
    from backend import security

    a, b = sessions
    key = a.post("/api/demo").json()["id"]
    cookie = a.cookies.get(COOKIE)
    later = security.time.time() + 1900
    monkeypatch.setattr(security.time, "time", lambda: later)
    b.cookies.set(COOKIE, cookie)
    assert b.post(f"/api/datasets/{key}/analyze", json={}).status_code == 404
