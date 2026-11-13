"""Check a controlled DatAtlas restart, state persistence and first-project isolation."""

import base64
import json
from pathlib import Path
import sqlite3
import subprocess
import time
import urllib.request
import urllib.error

access = dict(line.split(": ", 1) for line in Path("/etc/datatlas/access.txt").read_text().splitlines())
authorization = "Basic " + base64.b64encode((access["User"] + ":" + access["Password"]).encode()).decode()


def request(path, data=None):
    req = urllib.request.Request(
        access["URL"] + path,
        data=data,
        headers={"Authorization": authorization, "Content-Type": "application/json", "Origin": access["URL"]},
    )
    return urllib.request.urlopen(req, timeout=20)


def budget():
    with sqlite3.connect("file:/var/lib/datatlas/gemini-quota.sqlite3?mode=ro", uri=True) as connection:
        return connection.execute("SELECT slot, requests FROM daily ORDER BY slot").fetchall()


with request("/api/demo", b"") as response:
    key = json.load(response)["id"]
before = budget()
subprocess.run(["systemctl", "restart", "datatlas"], check=True)
for attempt in range(30):
    try:
        with request("/api/status") as response:
            assert json.load(response)["mode"] == "personal"
        break
    except (OSError, urllib.error.URLError):
        if attempt == 29:
            raise
        time.sleep(1)
try:
    request("/api/datasets/" + key + "/analyze", b"{}")
    raise AssertionError("Dataset incorrectly survived a restart")
except urllib.error.HTTPError as error:
    assert error.code == 404
assert budget() == before
print(
    json.dumps(
        {
            "restart": "ok",
            "datasets_are_ephemeral": True,
            "quota_persisted": True,
            "reserved_attempts": sum(row[1] for row in before),
        }
    )
)
subprocess.run(["python3", "/opt/datatlas/deploy/verify-isolation.py"], check=True)
