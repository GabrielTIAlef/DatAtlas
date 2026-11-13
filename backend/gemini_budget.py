"""Orçamento local persistente de requisições, sem armazenar perguntas ou dados."""

import os
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path


def reserve_request(path: Path, limit: int | None = None) -> bool:
    if limit is None:
        limit = int(os.getenv("GEMINI_DAILY_LIMIT", "30"))
    if limit <= 0:
        return False
    slot = datetime.now(timezone(timedelta(hours=-3))).date().isoformat()
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path, timeout=2) as connection:
        connection.execute(
            "CREATE TABLE IF NOT EXISTS daily (slot TEXT PRIMARY KEY, requests INTEGER NOT NULL)"
        )
        cursor = connection.execute(
            """INSERT INTO daily VALUES (?, 1) ON CONFLICT(slot) DO UPDATE
            SET requests = requests + 1 WHERE requests < ? RETURNING requests""",
            (slot, limit),
        )
        return cursor.fetchone() is not None
