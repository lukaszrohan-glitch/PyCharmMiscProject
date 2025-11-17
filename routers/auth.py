from __future__ import annotations

from fastapi import APIRouter, Depends

from schemas import UserLogin, PasswordChange, PasswordResetRequest, PasswordReset
from user_mgmt import (
    login_user,
    get_current_user,
    change_password,
    request_password_reset,
    reset_password_with_token,
)


router = APIRouter(tags=["Auth"])


@router.post("/api/auth/login", summary="Login with email and password")
def auth_login(payload: UserLogin):
    return login_user(payload.email, payload.password)


@router.get("/api/user/profile", summary="Get current user profile")
def user_profile(user=Depends(get_current_user)):
    return {
        k: user[k]
        for k in ["user_id", "email", "company_id", "is_admin", "subscription_plan"]
    }


@router.post("/api/auth/change-password", summary="Change current user password")
def auth_change_password(payload: PasswordChange, user=Depends(get_current_user)):
    return change_password(user["user_id"], payload.old_password, payload.new_password)


@router.post("/api/auth/request-reset", summary="Request password reset")
def auth_request_reset(payload: PasswordResetRequest):
    return request_password_reset(payload.email)


@router.post("/api/auth/reset", summary="Reset password with token")
def auth_reset(payload: PasswordReset):
    return reset_password_with_token(payload.token, payload.new_password)

