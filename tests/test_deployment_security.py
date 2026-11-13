import hashlib

import pytest
from fastapi.testclient import TestClient

from backend import main

DOMAIN = "datatlas.inteligencia-operacional.duckdns.org"


@pytest.fixture
def personal(monkeypatch):
    monkeypatch.setenv("DATATLAS_PUBLIC_MODE", "true")
    monkeypatch.setenv("DATATLAS_ALLOWED_HOSTS", DOMAIN)
    monkeypatch.setenv("DATATLAS_ALLOWED_ORIGINS", f"https://{DOMAIN}")
    monkeypatch.setenv("DATATLAS_AUTH_USER", "owner")
    monkeypatch.setenv("DATATLAS_AUTH_SHA256", hashlib.sha256(b"test-only-personal-password").hexdigest())
    monkeypatch.setenv("GEMINI_ENABLED", "false")
    main.STORE.clear()
    with TestClient(main.app, base_url=f"https://{DOMAIN}") as client:
        yield client
    main.STORE.clear()


@pytest.mark.parametrize(
    "path,method",
    [
        ("/", "get"),
        ("/api/status", "get"),
        ("/api/demo", "post"),
        ("/api/upload", "post"),
        ("/api/datasets/fake", "delete"),
    ],
)
def test_every_route_requires_personal_access(personal, path, method):
    response = getattr(personal, method)(path)
    assert response.status_code == 401
    assert "Basic" in response.headers["www-authenticate"]


def test_authorization_host_origin_and_https(personal):
    auth = ("owner", "test-only-personal-password")
    assert personal.get("/api/status", auth=auth).status_code == 200
    assert personal.get("/api/status", auth=("other", auth[1])).status_code == 401
    assert (
        personal.get("/api/status", auth=auth, headers={"Origin": "https://evil.example"}).status_code == 403
    )
    assert personal.get("/api/status", auth=auth, headers={"Host": "evil.example"}).status_code == 403
    assert (
        personal.get(
            f"http://{DOMAIN}/api/status", auth=auth, headers={"X-Forwarded-Proto": "https"}
        ).status_code
        == 403
    )
    assert personal.post("/api/demo", auth=auth, headers={"Origin": f"https://{DOMAIN}"}).status_code == 200


def test_public_configuration_fails_closed(personal, monkeypatch):
    monkeypatch.delenv("DATATLAS_AUTH_SHA256")
    assert personal.get("/api/status").status_code == 503


def test_memory_limit_is_explicit(monkeypatch):
    monkeypatch.setenv("DATATLAS_DATASET_MEMORY_BYTES", "1")
    with pytest.raises(main.HTTPException) as error:
        main.remember(main.pd.DataFrame({"a": [1]}), "test")
    assert error.value.status_code == 413


def test_external_host_cannot_disable_personal_auth(personal, monkeypatch):
    monkeypatch.setenv("DATATLAS_PUBLIC_MODE", "false")
    assert personal.get("/api/status").status_code == 503


def test_heavy_operations_reject_overlap():
    assert main.PROCESS.acquire(blocking=False)
    try:
        with pytest.raises(main.HTTPException) as error:
            main.demo()
        assert error.value.status_code == 429
    finally:
        main.PROCESS.release()
