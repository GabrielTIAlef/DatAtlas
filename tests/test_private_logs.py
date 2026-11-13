from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from backend import main


def test_provider_exception_never_logs_secret_or_payload(monkeypatch, tmp_path, caplog):
    main.STORE.clear()
    monkeypatch.setenv("GEMINI_ENABLED", "true")
    monkeypatch.setenv("GEMINI_API_KEY", "private-test-key")
    monkeypatch.setenv("GEMINI_BUDGET_PATH", str(tmp_path / "budget.sqlite3"))
    client = TestClient(main.app)
    key = client.post("/api/upload?name=test.csv", content=b"receita\n25\n").json()["id"]
    mock = MagicMock()
    mock.return_value.__enter__.return_value.models.generate_content.side_effect = RuntimeError(
        "private-test-key secret-question user-cell"
    )
    try:
        with patch("google.genai.Client", mock):
            response = client.post(f"/api/datasets/{key}/ask", json={"question": "soma de receita"})
        assert response.status_code == 200 and response.json()["source"] == "Local"
        assert "RuntimeError" in caplog.text
        assert all(value not in caplog.text for value in ("private-test-key", "secret-question", "user-cell"))
    finally:
        main.STORE.clear()
