"""Check secret absence without writing secret values to evidence or logs."""

from pathlib import Path
import subprocess

secret = Path("/etc/datatlas/gemini-key.txt").read_bytes().strip()
access = dict(line.split(": ", 1) for line in Path("/etc/datatlas/access.txt").read_text().splitlines())
password = access["Password"].encode()
files = []
for directory in ("backend", "frontend/dist", "deploy"):
    files.extend(
        path
        for path in (Path("/opt/datatlas") / directory).rglob("*")
        if path.is_file() and "__pycache__" not in str(path)
    )
for path in files:
    value = path.read_bytes()
    assert secret not in value and password not in value, "Secret found in an application file"
logs = subprocess.check_output(["journalctl", "-u", "datatlas", "--no-pager"], stderr=subprocess.DEVNULL)
assert secret not in logs and password not in logs
assert (
    subprocess.run(
        ["runuser", "-u", "datatlas", "--", "test", "-r", "/etc/datatlas/gemini-key.txt"]
    ).returncode
    == 0
)
assert (
    subprocess.run(["runuser", "-u", "aio", "--", "test", "-r", "/etc/datatlas/gemini-key.txt"]).returncode
    != 0
)
print("No credential values in source/build/service logs; service can read its key; other app cannot")
