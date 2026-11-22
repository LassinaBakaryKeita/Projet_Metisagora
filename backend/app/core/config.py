
from pathlib import Path

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# Chemin absolu vers le fichier .env situé à la racine du backend
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):

   
    # DATABASE
    database_url: str

  
    # SECURITY / JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

  
    # AI - GEMINI
    gemini_api_key: SecretStr

   
    # WHATSAPP CLOUD API (META)
    whatsapp_access_token: SecretStr
    whatsapp_phone_number_id: str
    whatsapp_verify_token: SecretStr
    whatsapp_api_version: str = "v25.0"


    # SETTINGS CONFIGURATION
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore"
    )

   
    # DATABASE URL NORMALIZATION
    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:

        if value.startswith("postgresql://"):
            return value.replace(
                "postgresql://",
                "postgresql+psycopg://",
                1
            )

        return value


# Instance globale de configuration
settings = Settings()
