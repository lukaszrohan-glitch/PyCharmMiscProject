from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from schemas import UserLogin, PasswordChange, PasswordResetRequest, PasswordReset
from user_mgmt import (
    login_user,
    get_current_user,
    change_password,
    request_password_reset,
    reset_password_with_token,
)


router = APIRouter(tags=["Auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/api/auth/login", summary="Login with email and password")
@limiter.limit("5/minute")  # Max 5 login attempts per minute per IP
async def auth_login(request: Request, payload: UserLogin):
    """
    Zwraca:
      - tokens: {access_token, refresh_token, expires_in}
      - user: podstawowe informacje o użytkowniku

    Rate limit: 5 attempts per minute to prevent brute force attacks.
    """
    return login_user(payload.email, payload.password)


@router.get("/api/user/profile", summary="Get current user profile")
def user_profile(user=Depends(get_current_user)):
    """
    Profil aktualnie zalogowanego użytkownika (na podstawie JWT w Authorization: Bearer).
    """
    return {
        k: user[k]
        for k in ["user_id", "email", "company_id", "is_admin", "subscription_plan"]
    }


@router.post("/api/auth/change-password", summary="Change current user password")
def auth_change_password(payload: PasswordChange, user=Depends(get_current_user)):
    """
    Zmiana hasła zalogowanego użytkownika.
    """
    return change_password(user["user_id"], payload.old_password, payload.new_password)


@router.post("/api/auth/request-reset", summary="Request password reset")
@limiter.limit("3/hour")  # Max 3 reset requests per hour per IP
async def auth_request_reset(request: Request, payload: PasswordResetRequest):
    """
    Tworzy token resetu hasła (obsługa wysyłki maila leży po Twojej stronie / w logach).

    Rate limit: 3 requests per hour to prevent abuse.
    """
    return request_password_reset(payload.email)


@router.post("/api/auth/reset", summary="Reset password with token")
def auth_reset(payload: PasswordReset):
    """
    Reset hasła na podstawie tokenu z poprzedniego kroku.
    """
    return reset_password_with_token(payload.token, payload.new_password)
