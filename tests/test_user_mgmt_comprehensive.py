import pytest
import user_mgmt
import db
import os
from datetime import datetime, timedelta
from fastapi import HTTPException
from jose import jwt


class TestUserTableCreation:
    """Test user and plan table creation."""

    def test_ensure_user_tables_creates_tables(self, app_client):
        user_mgmt.ensure_user_tables()
        
        users_table = db.fetch_one("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        plans_table = db.fetch_one("SELECT name FROM sqlite_master WHERE type='table' AND name='subscription_plans'")
        
        assert users_table is not None
        assert plans_table is not None

    def test_ensure_user_tables_creates_admin_user(self, app_client):
        user_mgmt.ensure_user_tables()
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@arkuszowniasmb.pl')
        
        admin = db.fetch_one("SELECT * FROM users WHERE email = ?", (admin_email,))
        assert admin is not None
        assert admin["is_admin"] is True or admin["is_admin"] == 1

    def test_ensure_user_tables_idempotent(self, app_client):
        user_mgmt.ensure_user_tables()
        user_mgmt.ensure_user_tables()
        
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@arkuszowniasmb.pl')
        admin = db.fetch_one("SELECT * FROM users WHERE email = ?", (admin_email,))
        assert admin is not None


class TestUserCreation:
    """Test user creation and validation."""

    def test_create_user_basic(self, app_client):
        user_mgmt.ensure_user_tables()
        
        user = user_mgmt.create_user(
            email="newuser@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free"
        )
        
        assert user is not None
        assert user["email"] == "newuser@test.com"
        assert user["company_id"] == "COMP-001"
        assert user["is_admin"] is False or user["is_admin"] == 0
        assert user["subscription_plan"] == "free"
        assert "initial_password" in user
        assert len(user["initial_password"]) >= 8

    def test_create_user_with_custom_password(self, app_client):
        user_mgmt.ensure_user_tables()
        
        custom_password = "SecurePass123!@"
        user = user_mgmt.create_user(
            email="custompass@test.com",
            company_id="COMP-002",
            is_admin=False,
            subscription_plan="pro",
            initial_password=custom_password
        )
        
        assert user["initial_password"] == custom_password

    def test_create_user_admin(self, app_client):
        user_mgmt.ensure_user_tables()
        
        user = user_mgmt.create_user(
            email="admin@test.com",
            company_id="COMP-003",
            is_admin=True,
            subscription_plan="enterprise"
        )
        
        assert user["is_admin"] is True or user["is_admin"] == 1

    def test_create_user_duplicate_email_fails(self, app_client):
        user_mgmt.ensure_user_tables()
        user_mgmt.create_user(
            email="duplicate@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            user_mgmt.create_user(
                email="duplicate@test.com",
                company_id="COMP-002",
                is_admin=False,
                subscription_plan="free"
            )
        assert exc_info.value.status_code == 500

    def test_create_user_password_too_short_fails(self, app_client):
        user_mgmt.ensure_user_tables()
        
        with pytest.raises(HTTPException) as exc_info:
            user_mgmt.create_user(
                email="shortpwd@test.com",
                company_id="COMP-001",
                is_admin=False,
                subscription_plan="free",
                initial_password="short"
            )
        assert exc_info.value.status_code == 400

    def test_create_user_generates_unique_ids(self, app_client):
        user_mgmt.ensure_user_tables()
        
        user1 = user_mgmt.create_user(
            email="user1@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free"
        )
        user2 = user_mgmt.create_user(
            email="user2@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free"
        )
        
        assert user1["user_id"] != user2["user_id"]


class TestUserLogin:
    """Test user login and authentication."""

    def test_login_success(self, app_client):
        user_mgmt.ensure_user_tables()
        password = "TestPass123!@"
        created = user_mgmt.create_user(
            email="login@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password=password
        )
        
        result = user_mgmt.login_user("login@test.com", password)
        
        assert "tokens" in result
        assert "access_token" in result["tokens"]
        assert "refresh_token" in result["tokens"]
        assert result["user"]["email"] == "login@test.com"
        assert result["user"]["user_id"] == created["user_id"]

    def test_login_invalid_email(self, app_client):
        user_mgmt.ensure_user_tables()
        
        with pytest.raises(HTTPException) as exc_info:
            user_mgmt.login_user("nonexistent@test.com", "AnyPassword123!")
        assert exc_info.value.status_code == 401
        assert "Invalid credentials" in exc_info.value.detail

    def test_login_wrong_password(self, app_client):
        user_mgmt.ensure_user_tables()
        user_mgmt.create_user(
            email="wrongpwd@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password="CorrectPass123!"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            user_mgmt.login_user("wrongpwd@test.com", "WrongPass123!")
        assert exc_info.value.status_code == 401

    def test_login_increments_failed_attempts(self, app_client):
        user_mgmt.ensure_user_tables()
        email = "failedat@test.com"
        password = "CorrectPass123!"
        user_mgmt.create_user(
            email=email,
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password=password
        )
        
        for _ in range(3):
            try:
                user_mgmt.login_user(email, "WrongPass123!")
            except HTTPException:
                pass
        
        user = db.fetch_one("SELECT failed_login_attempts FROM users WHERE email = ?", (email,))
        assert user["failed_login_attempts"] == 3

    def test_login_resets_failed_attempts_on_success(self, app_client):
        user_mgmt.ensure_user_tables()
        email = "resetfailed@test.com"
        password = "CorrectPass123!"
        user_mgmt.create_user(
            email=email,
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password=password
        )
        
        for _ in range(2):
            try:
                user_mgmt.login_user(email, "WrongPass123!")
            except HTTPException:
                pass
        
        result = user_mgmt.login_user(email, password)
        assert "tokens" in result
        
        user = db.fetch_one("SELECT failed_login_attempts FROM users WHERE email = ?", (email,))
        assert user["failed_login_attempts"] == 0


class TestPasswordManagement:
    """Test password change and reset functionality."""

    def test_change_password_success(self, app_client):
        user_mgmt.ensure_user_tables()
        old_password = "OldPass123!"
        new_password = "NewPass456!"
        created = user_mgmt.create_user(
            email="changepwd@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password=old_password
        )
        user_id = created["user_id"]
        
        result = user_mgmt.change_password(user_id, old_password, new_password)
        assert result["changed"] is True
        
        login_result = user_mgmt.login_user("changepwd@test.com", new_password)
        assert "tokens" in login_result

    def test_change_password_wrong_old_password(self, app_client):
        user_mgmt.ensure_user_tables()
        created = user_mgmt.create_user(
            email="wrongold@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password="CorrectPass123!"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            user_mgmt.change_password(created["user_id"], "WrongPass123!", "NewPass456!")
        assert exc_info.value.status_code == 401

    def test_request_password_reset_existing_user(self, app_client):
        user_mgmt.ensure_user_tables()
        email = "resetreq@test.com"
        user_mgmt.create_user(
            email=email,
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free"
        )
        
        result = user_mgmt.request_password_reset(email)
        assert "reset_token" in result
        assert result["reset_token"] is not None

    def test_request_password_reset_nonexistent_user(self, app_client):
        user_mgmt.ensure_user_tables()
        
        result = user_mgmt.request_password_reset("nonexistent@test.com")
        assert "message" in result
        assert "If email exists" in result["message"]

    def test_reset_password_with_token(self, app_client):
        user_mgmt.ensure_user_tables()
        created = user_mgmt.create_user(
            email="tokenreset@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password="OldPass123!"
        )
        
        reset_result = user_mgmt.request_password_reset("tokenreset@test.com")
        reset_token = reset_result["reset_token"]
        
        new_password = "NewTokenPass456!"
        result = user_mgmt.reset_password_with_token(reset_token, new_password)
        assert result["changed"] is True
        
        login_result = user_mgmt.login_user("tokenreset@test.com", new_password)
        assert "tokens" in login_result

    def test_reset_password_too_short(self, app_client):
        user_mgmt.ensure_user_tables()
        user_mgmt.create_user(
            email="shortpwdreset@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free"
        )
        
        reset_result = user_mgmt.request_password_reset("shortpwdreset@test.com")
        reset_token = reset_result["reset_token"]
        
        with pytest.raises(HTTPException) as exc_info:
            user_mgmt.reset_password_with_token(reset_token, "short")
        assert exc_info.value.status_code == 400

    def test_reset_password_invalid_token(self, app_client):
        user_mgmt.ensure_user_tables()
        
        with pytest.raises(HTTPException) as exc_info:
            user_mgmt.reset_password_with_token("invalid-token-xyz", "NewPass456!")
        assert exc_info.value.status_code == 400


class TestTokenGeneration:
    """Test JWT token creation and validation."""

    def test_make_token_structure(self, app_client):
        user_mgmt.ensure_user_tables()
        user = {
            "user_id": "U-test123",
            "email": "token@test.com",
            "is_admin": False
        }
        
        tokens = user_mgmt._make_token(user)
        
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert "expires_in" in tokens
        assert tokens["expires_in"] > 0

    def test_decode_token_success(self, app_client):
        user_mgmt.ensure_user_tables()
        user = {
            "user_id": "U-test123",
            "email": "decode@test.com",
            "is_admin": False
        }
        
        tokens = user_mgmt._make_token(user)
        auth_header = f"Bearer {tokens['access_token']}"
        
        payload = user_mgmt.decode_token(auth_header)
        assert payload["sub"] == "U-test123"
        assert payload["email"] == "decode@test.com"
        assert payload["is_admin"] is False

    def test_decode_token_missing_bearer(self, app_client):
        with pytest.raises(HTTPException) as exc_info:
            user_mgmt.decode_token("InvalidToken123")
        assert exc_info.value.status_code == 401

    def test_decode_token_invalid_token(self, app_client):
        with pytest.raises(HTTPException) as exc_info:
            user_mgmt.decode_token("Bearer invalid-jwt-token")
        assert exc_info.value.status_code == 401

    def test_decode_token_expired_token(self, app_client):
        expired_payload = {
            "sub": "U-test123",
            "email": "expired@test.com",
            "exp": datetime.utcnow() - timedelta(hours=1),
            "type": "access"
        }
        expired_token = jwt.encode(expired_payload, user_mgmt.JWT_SECRET, algorithm=user_mgmt.JWT_ALG)
        
        with pytest.raises(HTTPException) as exc_info:
            user_mgmt.decode_token(f"Bearer {expired_token}")
        assert exc_info.value.status_code == 401


class TestUserRetrieval:
    """Test fetching user information."""

    def test_get_current_user_success(self, app_client):
        user_mgmt.ensure_user_tables()
        email = "getcurrent@test.com"
        created = user_mgmt.create_user(
            email=email,
            company_id="COMP-001",
            is_admin=True,
            subscription_plan="enterprise"
        )
        user_id = created["user_id"]
        
        login_result = user_mgmt.login_user(email, created["initial_password"])
        auth_header = f"Bearer {login_result['tokens']['access_token']}"
        
        user = user_mgmt.get_current_user(auth_header)
        assert user["user_id"] == user_id
        assert user["email"] == email
        assert user["is_admin"] is True or user["is_admin"] == 1

    def test_get_current_user_missing_token(self, app_client):
        with pytest.raises(HTTPException) as exc_info:
            user_mgmt.get_current_user(None)
        assert exc_info.value.status_code == 401

    def test_require_admin_success(self, app_client):
        user_mgmt.ensure_user_tables()
        admin = user_mgmt.create_user(
            email="admin@test.com",
            company_id="COMP-001",
            is_admin=True,
            subscription_plan="enterprise"
        )
        
        login_result = user_mgmt.login_user("admin@test.com", admin["initial_password"])
        auth_header = f"Bearer {login_result['tokens']['access_token']}"
        
        user = user_mgmt.get_current_user(auth_header)
        admin_user = user_mgmt.require_admin(user)
        assert admin_user["is_admin"] is True or admin_user["is_admin"] == 1

    def test_require_admin_non_admin_fails(self, app_client):
        user_mgmt.ensure_user_tables()
        non_admin = user_mgmt.create_user(
            email="nonadmin@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free"
        )
        
        login_result = user_mgmt.login_user("nonadmin@test.com", non_admin["initial_password"])
        auth_header = f"Bearer {login_result['tokens']['access_token']}"
        
        user = user_mgmt.get_current_user(auth_header)
        
        with pytest.raises(HTTPException) as exc_info:
            user_mgmt.require_admin(user)
        assert exc_info.value.status_code == 403


class TestListUsers:
    """Test user listing."""

    def test_list_users_basic(self, app_client):
        user_mgmt.ensure_user_tables()
        user_mgmt.create_user(
            email="list1@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free"
        )
        user_mgmt.create_user(
            email="list2@test.com",
            company_id="COMP-002",
            is_admin=True,
            subscription_plan="pro"
        )
        
        users = user_mgmt.list_users()
        assert isinstance(users, list)
        assert len(users) >= 2
        emails = [u["email"] for u in users]
        assert "list1@test.com" in emails
        assert "list2@test.com" in emails

    def test_list_users_contains_admin_flag(self, app_client):
        user_mgmt.ensure_user_tables()
        
        users = user_mgmt.list_users()
        assert len(users) > 0
        for user in users:
            assert "is_admin" in user
            assert "email" in user
            assert "user_id" in user


class TestSubscriptionPlans:
    """Test subscription plan management."""

    def test_create_plan(self, app_client):
        user_mgmt.ensure_user_tables()
        
        plan = user_mgmt.create_plan(
            plan_id="plan-basic",
            name="Basic Plan",
            max_orders=100,
            max_users=5,
            features=["export", "api-access"]
        )
        
        assert plan is not None
        assert plan["plan_id"] == "plan-basic"
        assert plan["name"] == "Basic Plan"
        assert plan["max_orders"] == 100
        assert plan["max_users"] == 5

    def test_create_plan_without_features(self, app_client):
        user_mgmt.ensure_user_tables()
        
        plan = user_mgmt.create_plan(
            plan_id="plan-minimal",
            name="Minimal Plan",
            max_orders=50,
            max_users=1,
            features=None
        )
        
        assert plan is not None
        assert plan["plan_id"] == "plan-minimal"

    def test_list_plans(self, app_client):
        user_mgmt.ensure_user_tables()
        user_mgmt.create_plan(
            plan_id="plan-1",
            name="Plan One",
            max_orders=100,
            max_users=5,
            features=["feature1"]
        )
        user_mgmt.create_plan(
            plan_id="plan-2",
            name="Plan Two",
            max_orders=500,
            max_users=20,
            features=["feature1", "feature2"]
        )
        
        plans = user_mgmt.list_plans()
        assert isinstance(plans, list)
        assert len(plans) >= 2
        plan_ids = [p["plan_id"] for p in plans]
        assert "plan-1" in plan_ids
        assert "plan-2" in plan_ids

    def test_list_plans_features_parsed(self, app_client):
        user_mgmt.ensure_user_tables()
        user_mgmt.create_plan(
            plan_id="plan-features",
            name="Features Plan",
            max_orders=100,
            max_users=10,
            features=["feature1", "feature2", "feature3"]
        )
        
        plans = user_mgmt.list_plans()
        features_plan = next((p for p in plans if p["plan_id"] == "plan-features"), None)
        assert features_plan is not None
        assert isinstance(features_plan["features"], list)
        assert "feature1" in features_plan["features"]
        assert "feature2" in features_plan["features"]
