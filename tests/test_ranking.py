import pytest

from backend import main
from fastapi.testclient import TestClient


def test_top20_share_uses_all_groups_not_only_visible_items():
    content = "grupo,valor\n" + "\n".join(f"G{i},1" for i in range(31))
    client = TestClient(main.app)
    main.STORE.clear()
    try:
        key = client.post("/api/upload?name=grupos.csv", content=content.encode()).json()["id"]
        result = client.post(
            f"/api/datasets/{key}/analyze", json={"group": "grupo", "aggregation": "count"}
        ).json()["context_chart"]
        assert len(result["items"]) == 20 and result["total_groups"] == 31
        assert result["total_value"] == 31
        assert all(i["share"] == pytest.approx(1 / 31) for i in result["items"])
    finally:
        main.STORE.clear()
