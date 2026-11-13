"""Explicit hosts/origins and a single personal account for the public deployment."""

import base64
import binascii
import hashlib
import hmac
import os
import re
import secrets
import time
from contextvars import ContextVar

from fastapi.responses import JSONResponse

LOCAL_HOSTS = {"localhost", "127.0.0.1", "testserver"}
OWNER = ContextVar("datatlas_owner", default="local")
COOKIE = "__Host-datatlas_session"


def browser_session(request):
    secret = os.getenv("DATATLAS_SESSION_KEY", "")
    if len(secret) < 64:
        return JSONResponse({"detail": "Sessões ainda não configuradas."}, status_code=503)
    now = int(time.time())
    identifier = None
    try:
        candidate, issued, signature = request.cookies.get(COOKIE, "").split(".")
        payload = candidate + "." + issued
        expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if (
            re.fullmatch(r"[a-f0-9]{64}", candidate)
            and 0 <= now - int(issued) <= 1800
            and hmac.compare_digest(expected, signature)
        ):
            identifier = candidate
    except (ValueError, TypeError):
        pass
    identifier = identifier or secrets.token_hex(32)
    payload = identifier + "." + str(now)
    signature = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    request.state.owner_id = hashlib.sha256(identifier.encode()).hexdigest()
    request.state.session_cookie = payload + "." + signature
    return None


def configured_list(name, default):
    values = {value.strip() for value in os.getenv(name, default).split(",") if value.strip()}
    if not values or any("*" in value for value in values):
        raise ValueError(f"{name} requires explicit values")
    return values


def access_error(request):
    request.state.owner_id = "local"
    try:
        hosts = configured_list("DATATLAS_ALLOWED_HOSTS", ",".join(sorted(LOCAL_HOSTS)))
        hostname = request.url.hostname
        if hostname not in hosts:
            return JSONResponse({"detail": "Endereço não autorizado."}, status_code=403)
        origin = request.headers.get("origin")
        own_origin = f"{request.url.scheme}://{request.url.netloc}"
        origins = configured_list("DATATLAS_ALLOWED_ORIGINS", own_origin)
        if origin is not None and (origin not in origins or origin != own_origin):
            return JSONResponse({"detail": "Origem não autorizada."}, status_code=403)
    except ValueError:
        return JSONResponse({"detail": "Configuração de acesso inválida."}, status_code=403)

    if os.getenv("DATATLAS_PUBLIC_MODE") != "true":
        if hostname not in LOCAL_HOSTS:
            return JSONResponse(
                {"detail": "Ative o acesso pessoal protegido para este endereço."}, status_code=503
            )
        return None
    if request.url.scheme != "https" and hostname not in {"localhost", "127.0.0.1"}:
        return JSONResponse({"detail": "HTTPS obrigatório."}, status_code=403)
    if os.getenv("DATATLAS_ACCESS_MODE", "personal") == "session":
        return browser_session(request)
    expected_user = os.getenv("DATATLAS_AUTH_USER", "")
    expected_digest = os.getenv("DATATLAS_AUTH_SHA256", "")
    if not expected_user or not re.fullmatch(r"[0-9a-f]{64}", expected_digest):
        return JSONResponse({"detail": "Acesso ainda não configurado."}, status_code=503)
    try:
        scheme, encoded = request.headers.get("authorization", "").split(" ", 1)
        if scheme.lower() != "basic":
            raise ValueError("Unsupported authentication")
        user, password = base64.b64decode(encoded, validate=True).decode("utf-8").split(":", 1)
        valid_user = hmac.compare_digest(user.encode(), expected_user.encode())
        valid_password = hmac.compare_digest(hashlib.sha256(password.encode()).hexdigest(), expected_digest)
        if valid_user and valid_password:
            request.state.owner_id = "personal"
            return None
    except (ValueError, UnicodeError, binascii.Error):
        pass
    return JSONResponse(
        {"detail": "Entre com o acesso pessoal do DatAtlas."},
        status_code=401,
        headers={"WWW-Authenticate": 'Basic realm="DatAtlas", charset="UTF-8"', "Cache-Control": "no-store"},
    )
