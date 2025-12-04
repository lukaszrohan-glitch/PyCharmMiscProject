from __future__ import annotations

import logging
import os
from typing import Optional
from fastapi import Depends, Header, HTTPException

from config import settings
import auth

logger = logging.getLogger(__name__)


def check_api_key(
    x_api_key: Optional[str] = Header(None),
    api_key: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    *,
    allow_readonly: bool = False,
):
    """
    Require either:
      - JWT in Authorization: Bearer <token>
      - API key in x-api-key or ?api_key=

    Hardened onboarding: even if there are no API keys defined, writes are NOT allowed
    without a valid JWT. This function is used only on write endpoints unless
    `allow_readonly=True`, which relaxes the requirement for public GETs (finance, shortages, etc.).
    """
    key = x_api_key or api_key

    # JWT in Authorization header
    if authorization and authorization.startswith("Bearer "):
        try:
            from user_mgmt import decode_token  # lazy import to avoid cycles

            token = authorization.split(" ", 1)[1]
            decode_token(token)
            return True
        except Exception as e:
            logger.debug(f"JWT token validation failed: {e}")
            # If readonly is allowed and we have a Bearer token (even if invalid),
            # allow access. This prevents logged-in users from getting API key errors.
            if allow_readonly:
                return True

    # If readonly allowed and no key required, permit access
    if allow_readonly and not key:
        return True

    # Require API key when JWT not valid
    if not key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    # Env keys first (allow runtime override via environment)
    env_keys_raw = os.getenv("API_KEYS") or settings.API_KEYS
    env_keys = [k.strip() for k in env_keys_raw.split(",")] if env_keys_raw else []
    if env_keys and key in env_keys:
        return True

    # DB-stored API keys
    try:
        row = auth.get_api_key(key)
        if row:
            try:
                if row.get("id"):
                    from auth import mark_last_used, log_api_key_event

                    mark_last_used(row.get("id"))
                    log_api_key_event(row.get("id"), "used", "api")
            except Exception as e:
                logger.warning(f"Failed to log API key event: {e}")
            return True
    except Exception as e:
        logger.warning(f"DB error checking API key: {e}")

    raise HTTPException(status_code=401, detail="Invalid or missing API key")


def check_admin_key(x_admin_key: Optional[str] = Header(None)):
    # Read from environment at call time to allow tests or runtime overrides
    admin_key = os.getenv("ADMIN_KEY") or settings.ADMIN_KEY
    if not admin_key:
        raise HTTPException(status_code=401, detail="Admin key not configured")
    if x_admin_key != admin_key:
        raise HTTPException(status_code=401, detail="Invalid admin key")
    return True


def require_auth(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.split(" ", 1)[1]
    from user_mgmt import decode_token

    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    class AuthUser:
        def __init__(self, data):
            self.user_id = data.get("sub") or data.get("user_id")
            self.email = data.get("email")
            self.is_admin = data.get("is_admin", False)
    return AuthUser(payload)
