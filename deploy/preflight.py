"""Read-only inventory and protected recovery snapshot before DatAtlas install."""

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
import subprocess
import tarfile
import urllib.request

assert os.geteuid() == 0
assert not Path("/opt/datatlas").exists(), "Inspect existing DatAtlas directory before proceeding"
assert not Path("/etc/nginx/sites-enabled/datatlas").exists()
assert (
    subprocess.run(
        ["ss", "-lntH", "sport", "=", ":8012"], capture_output=True, text=True, check=True
    ).stdout.strip()
    == ""
)
folder = Path("/var/backups/datatlas") / ("before-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"))
folder.mkdir(parents=True, mode=0o700)
folder.parent.chmod(0o700)
with tarfile.open(folder / "nginx-config.tar.gz", "w:gz") as archive:
    archive.add("/etc/nginx", arcname="etc/nginx")
(folder / "nginx-config.tar.gz").chmod(0o600)
with (folder / "aio-before.dump").open("wb") as output:
    subprocess.run(["runuser", "-u", "postgres", "--", "pg_dump", "-Fc", "aio"], stdout=output, check=True)
(folder / "aio-before.dump").chmod(0o600)
paths = [
    Path("/etc/nginx/nginx.conf"),
    Path("/etc/nginx/sites-available/aio-https"),
    Path("/etc/nginx/aio-proxy.conf"),
    Path("/etc/systemd/system/aio-api.service"),
    Path("/etc/aio/app.env"),
]
paths += sorted(Path("/opt/aio/app").glob("*.py"))
paths += sorted(path for path in Path("/var/www/aio").rglob("*") if path.is_file())
fingerprints = {str(path): hashlib.sha256(path.read_bytes()).hexdigest() for path in paths}
with urllib.request.urlopen("https://inteligencia-operacional.duckdns.org/health", timeout=15) as response:
    assert json.load(response)["status"] == "ok"
snapshot = {
    "files": fingerprints,
    "aio_pid": subprocess.check_output(
        ["systemctl", "show", "aio-api", "-p", "MainPID", "--value"], text=True
    ).strip(),
}
(folder / "baseline.json").write_text(json.dumps(snapshot, indent=2))
(folder / "baseline.json").chmod(0o600)
Path("/var/backups/datatlas/active-snapshot").write_text(str(folder))
print(
    json.dumps(
        {"snapshot": str(folder), "first_project_health": "ok", "tracked_unchanged_files": len(fingerprints)}
    )
)
