"""Metadata-only authentication/configuration check. No dataset or prompt sent."""

import os
import sys

from dotenv import dotenv_values
from google import genai
from google.genai import types

sys.path.insert(0, "/opt/datatlas")
from backend.main import Intent, gemini_settings

os.environ.update(
    {key: value for key, value in dotenv_values("/etc/datatlas/app.env").items() if value is not None}
)
try:
    settings = gemini_settings()
    assert settings
    options = types.HttpOptions(timeout=15000, retry_options=types.HttpRetryOptions(attempts=1))
    types.GenerateContentConfig(
        response_mime_type="application/json", response_json_schema=Intent.model_json_schema()
    )
    print("SDK_CONFIG_OK")
    with genai.Client(api_key=settings["key"], http_options=options) as client:
        client.models.get(model=settings["model"])
    print("MODEL_METADATA_ACCESS_OK")
except Exception as error:
    print("ERROR_TYPE=" + type(error).__name__)
    print("PROVIDER_STATUS=" + str(getattr(error, "code", None)))
