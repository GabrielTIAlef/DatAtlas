"""Explicitly authorized switch from personal login to isolated browser sessions."""

import os
from pathlib import Path
import secrets
import shutil
import subprocess
import sys
import tarfile

assert os.geteuid() == 0
snapshot = Path("/var/backups/datatlas/before-public-sessions")
if sys.argv[1:] == ["backup"]:
    assert not snapshot.exists(), "Inspect the existing rollback snapshot first"
    snapshot.mkdir(mode=0o700)
    shutil.copy2("/etc/datatlas/app.env", snapshot / "app.env")
    (snapshot / "app.env").chmod(0o600)
    with tarfile.open(snapshot / "application.tar.gz", "w:gz") as archive:
        archive.add("/opt/datatlas/backend", arcname="backend")
        archive.add("/opt/datatlas/frontend/dist", arcname="frontend/dist")
    (snapshot / "application.tar.gz").chmod(0o600)
    print("Protected DatAtlas rollback snapshot created")
elif sys.argv[1:] == ["enable"]:
    assert (snapshot / "app.env").exists()
    path = Path("/etc/datatlas/app.env")
    values = dict(line.split("=", 1) for line in path.read_text().splitlines() if "=" in line)
    values["DATATLAS_ACCESS_MODE"] = "session"
    values.setdefault("DATATLAS_SESSION_KEY", secrets.token_hex(32))
    path.write_text("".join(f"{key}={value}\n" for key, value in values.items()))
    path.chmod(0o600)
    subprocess.run(["systemctl", "restart", "datatlas"], check=True)
    print("Public access enabled with isolated signed browser sessions; limits unchanged")
else:
    raise SystemExit("Use backup or enable")
