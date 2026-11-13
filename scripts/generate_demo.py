"""Gera dados artificiais, de modo determinístico e sem informações pessoais."""

import csv
import random
from datetime import date, timedelta
from pathlib import Path

rng = random.Random(42)
rows = []
for i in range(360):
    units = rng.randint(1, 14)
    price = rng.choice([49.9, 89.9, 149.9, 249.9])
    rows.append(
        [
            str(date(2026, 1, 1) + timedelta(days=i % 180)),
            rng.choice(["Sudeste", "Sul", "Nordeste", "Centro-Oeste", "Norte"]),
            rng.choice(["Digital", "Loja", "Parceiros"]),
            rng.choice(["Essencial", "Profissional", "Premium"]),
            units,
            round(units * price, 2),
            round(units * price * rng.uniform(0.45, 0.8), 2),
        ]
    )
rows[12][5] = 42000
rows[25][1] = ""
rows[30][5] = ""
rows.extend([rows[0], rows[1], rows[2]])
target = Path(__file__).resolve().parents[1] / "demo/vendas.csv"
if target.exists():
    raise SystemExit("Demo existente preservada; remova-a explicitamente antes de regenerar.")
target.parent.mkdir(exist_ok=True)
with target.open("w", encoding="utf-8", newline="") as stream:
    writer = csv.writer(stream)
    writer.writerow(["data", "regiao", "canal", "produto", "quantidade", "receita", "custo"])
    writer.writerows(rows)
print(f"Demo criada: {len(rows)} linhas sintéticas")
