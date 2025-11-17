from __future__ import annotations

import secrets
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    # Server / CORS
    CORS_ORIGINS: str = ''
    LOG_LEVEL: str = 'INFO'

    # DB
    DATABASE_URL: str = ''
    PG_SSLMODE: Optional[str] = None
    DB_POOL_MIN: int = 1
    DB_POOL_MAX: int = 10
    DB_CONNECT_TIMEOUT: int = 10

    # API keys / admin
    API_KEYS: str = ''
    ADMIN_KEY: Optional[str] = None

    # Auth / JWT
    JWT_SECRET: str = Field(default_factory=lambda: secrets.token_hex(32))
    JWT_EXP_MINUTES: int = 120
    JWT_REFRESH_DAYS: int = 7

    # Admin user bootstrap (tests/docs use these)
    ADMIN_EMAIL: str = 'admin@arkuszowniasmb.pl'
    ADMIN_PASSWORD: str = 'SMB#Admin2025!'

    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return []
        return [o.strip() for o in self.CORS_ORIGINS.split(',') if o.strip()]

    def api_keys_list(self) -> List[str]:
        if not self.API_KEYS:
            return []
        return [k.strip() for k in self.API_KEYS.split(',') if k.strip()]


settings = Settings()

