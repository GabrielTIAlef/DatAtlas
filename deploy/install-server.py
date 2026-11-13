"""Install isolated service/configuration; never modify Project 1 files."""

import hashlib
import os
from pathlib import Path
import pwd
import secrets
import subprocess

assert os.geteuid() == 0
assert Path("/var/backups/datatlas/active-snapshot").exists()
assert Path("/opt/datatlas/backend/main.py").exists()
assert not Path("/etc/systemd/system/datatlas.service").exists(), "Inspect existing service before replacing"
try:
    pwd.getpwnam("datatlas")
except KeyError:
    subprocess.run(
        [
            "useradd",
            "--system",
            "--home",
            "/var/lib/datatlas",
            "--create-home",
            "--shell",
            "/usr/sbin/nologin",
            "datatlas",
        ],
        check=True,
    )
user = pwd.getpwnam("datatlas")
state = Path("/var/lib/datatlas")
state.mkdir(exist_ok=True)
os.chown(state, user.pw_uid, user.pw_gid)
state.chmod(0o700)
config = Path("/etc/datatlas")
config.mkdir(mode=0o750, exist_ok=True)
os.chown(config, 0, user.pw_gid)
if not (config / "app.env").exists():
    password = secrets.token_urlsafe(24)
    (config / "access.txt").write_text(
        "URL: https://datatlas.inteligencia-operacional.duckdns.org\nUser: datatlas\nPassword: "
        + password
        + "\n"
    )
    (config / "access.txt").chmod(0o600)
    values = {
        "DATATLAS_PUBLIC_MODE": "true",
        "DATATLAS_ALLOWED_HOSTS": "datatlas.inteligencia-operacional.duckdns.org,127.0.0.1,localhost",
        "DATATLAS_ALLOWED_ORIGINS": "https://datatlas.inteligencia-operacional.duckdns.org",
        "DATATLAS_AUTH_USER": "datatlas",
        "DATATLAS_AUTH_SHA256": hashlib.sha256(password.encode()).hexdigest(),
        "GEMINI_ENABLED": "false",
        "GEMINI_KEY_FILE": "/etc/datatlas/gemini-key.txt",
        "GEMINI_MODEL": "gemini-3.1-flash-lite",
        "GEMINI_DAILY_LIMIT": "30",
        "GEMINI_BUDGET_PATH": "/var/lib/datatlas/gemini-quota.sqlite3",
        "DATATLAS_DATASET_MEMORY_BYTES": "25165824",
        "DATATLAS_STORE_MEMORY_BYTES": "50331648",
        "OPENBLAS_NUM_THREADS": "1",
        "OMP_NUM_THREADS": "1",
        "MKL_NUM_THREADS": "1",
    }
    (config / "app.env").write_text("".join(f"{key}={value}\n" for key, value in values.items()))
    (config / "app.env").chmod(0o600)
subprocess.run(["python3.12", "-m", "venv", "/opt/datatlas/.venv"], check=True)
subprocess.run(
    [
        "/opt/datatlas/.venv/bin/pip",
        "install",
        "--only-binary=:all:",
        "--no-cache-dir",
        "-r",
        "/opt/datatlas/requirements-dev.txt",
    ],
    check=True,
)
with Path("/opt/datatlas/requirements-linux.lock").open("w") as output:
    subprocess.run(["/opt/datatlas/.venv/bin/pip", "freeze"], stdout=output, check=True)
subprocess.run(
    ["install", "-m", "644", "/opt/datatlas/deploy/datatlas.service", "/etc/systemd/system/datatlas.service"],
    check=True,
)
subprocess.run(["systemctl", "daemon-reload"], check=True)
print("Isolated service installed; credential and publication still pending")
