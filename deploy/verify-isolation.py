"""Compare first-project files with the pre-deploy snapshot without exposing secrets."""

import hashlib
import json
from pathlib import Path
import subprocess
import urllib.request

folder = Path(Path("/var/backups/datatlas/active-snapshot").read_text().strip())
snapshot = json.loads((folder / "baseline.json").read_text())
changed = [
    path
    for path, digest in snapshot["files"].items()
    if hashlib.sha256(Path(path).read_bytes()).hexdigest() != digest
]
assert not changed, "First-project file changed: " + ",".join(changed)
pid = subprocess.check_output(["systemctl", "show", "aio-api", "-p", "MainPID", "--value"], text=True).strip()
assert pid == snapshot["aio_pid"], "First-project API PID changed during DatAtlas work"
with urllib.request.urlopen("https://inteligencia-operacional.duckdns.org/health", timeout=15) as response:
    assert json.load(response)["status"] == "ok"
print(
    json.dumps(
        {"first_project_files_unchanged": len(snapshot["files"]), "same_api_process": True, "health": "ok"}
    )
)
