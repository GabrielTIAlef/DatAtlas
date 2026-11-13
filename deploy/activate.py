"""Add only the DatAtlas virtual host, then validate its personal access."""

from pathlib import Path
import subprocess

assert Path("/etc/letsencrypt/live/datatlas.inteligencia-operacional.duckdns.org/fullchain.pem").exists()
target = Path("/etc/nginx/sites-available/datatlas")
link = Path("/etc/nginx/sites-enabled/datatlas")
assert not target.exists() and not link.exists(), "Inspect an existing DatAtlas host before replacing"
target.write_text(Path("/opt/datatlas/deploy/datatlas.nginx.conf").read_text())
link.symlink_to(target)
try:
    subprocess.run(["nginx", "-t"], check=True)
except subprocess.CalledProcessError:
    link.unlink()
    raise
subprocess.run(["systemctl", "reload", "nginx"], check=True)
print("DatAtlas virtual host activated; original virtual host unchanged")
