from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    ai_service_port: int = 8000
    gemini_api_key: str | None = None
    google_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(env_file=str(ENV_PATH), extra="ignore")


settings = Settings()


def get_gemini_api_key() -> str | None:
    return settings.gemini_api_key or settings.google_api_key
