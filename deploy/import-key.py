"""Receive the authorized secret through SSH stdin; never print its value."""

import io
import os
from pathlib import Path
import pwd
import re
import sys

from dotenv import dotenv_values

assert os.geteuid() == 0
raw = sys.stdin.buffer.read(65537)
if not 20 <= len(raw) <= 65536:
    raise SystemExit("Invalid secret file size")
text = raw.decode("utf-8-sig").strip()
if re.fullmatch(r"[A-Za-z0-9_.-]+", text):
    key = text
else:
    parsed = dotenv_values(stream=io.StringIO(text))
    key = parsed.get("GEMINI_API_KEY") or parsed.get("GOOGLE_API_KEY")
if not key or not re.fullmatch(r"[A-Za-z0-9_.-]{20,}", key):
    raise SystemExit("Secret file format is not supported; no key displayed")
path = Path("/etc/datatlas/gemini-key.txt")
path.touch(mode=0o600, exist_ok=True)
path.write_text(key + "\n")
os.chown(path, 0, pwd.getpwnam("datatlas").pw_gid)
path.chmod(0o640)
existing = dotenv_values("/etc/aio/app.env")
same = key == existing.get("GEMINI_API_KEY")
print("SAME_AS_PREVIOUSLY_CONFIRMED_FREE_KEY=" + str(same).lower())
if same:
    settings = Path("/etc/datatlas/app.env")
    settings.write_text(settings.read_text().replace("GEMINI_ENABLED=false", "GEMINI_ENABLED=true"))
    settings.chmod(0o600)
print("Secret imported with restricted permissions; no Project 1 setting changed")
