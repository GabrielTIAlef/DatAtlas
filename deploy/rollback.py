"""Deactivate only DatAtlas; retain its protected files for inspection/recovery."""

from pathlib import Path
import subprocess

subprocess.run(["systemctl", "disable", "--now", "datatlas.service"], check=False)
link = Path("/etc/nginx/sites-enabled/datatlas")
if link.is_symlink() and link.resolve() == Path("/etc/nginx/sites-available/datatlas"):
    link.unlink()
subprocess.run(["nginx", "-t"], check=True)
subprocess.run(["systemctl", "reload", "nginx"], check=True)
print("DatAtlas disabled; Project 1 files and service untouched")
