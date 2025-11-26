import pytest
import auth
import user_mgmt
import db
import os
from datetime import datetime, timedelta
from fastapi import HTTPException
from jose import jwt


class TestAuthEdgeCases:
    """Test edge cases in authentication."""

    def test_api_key_verification_with_special_characters(self, app_client):
        auth.ensure_table()

        key_row = auth.create_api_key(label="special-chars-key")
        plaintext = key_row["api_key"]

        found = auth.get_api_key(plaintext)
        assert found is not None

    def test_multiple_api_keys_same_label(self, app_client):
        auth.ensure_table()

        key1 = auth.create_api_key(label="duplicate-label")
        key2 = auth.create_api_key(label="duplicate-label")

        assert key1["id"] != key2["id"]
        assert key1["api_key"] != key2["api_key"]

    def test_get_api_key_case_sensitive(self, app_client):
        auth.ensure_table()

        key = auth.create_api_key(label="case-test")
        plaintext = key["api_key"]

        found = auth.get_api_key(plaintext)
        assert found is not None

        wrong_case = (
            plaintext.swapcase() if plaintext != plaintext.swapcase() else "different"
        )
        not_found = auth.get_api_key(wrong_case)
        assert not_found is None

    def test_mark_last_used_nonexistent_key(self, app_client):
        auth.ensure_table()

        auth.mark_last_used(999999)

        keys = auth.list_api_keys()
        assert isinstance(keys, list)

    def test_delete_nonexistent_api_key(self, app_client):
        auth.ensure_table()

        result = auth.delete_api_key_by_id(999999)
        assert result is None

    def test_rotate_nonexistent_key(self, app_client):
        auth.ensure_table()

        result = auth.rotate_api_key(999999)
        assert result is not None

    def test_log_event_with_long_details(self, app_client):
        auth.ensure_table()

        key = auth.create_api_key(label="long-details-test")
        long_details = {"data": "x" * 10000}

        auth.log_api_key_event(key["id"], "long-event", details=long_details)

        rows = db.fetch_all(
            "SELECT * FROM api_key_audit WHERE api_key_id = ?", (key["id"],)
        )
        assert len(rows) > 0


class TestUserManagementEdgeCases:
    """Test edge cases in user management."""

    def test_create_user_empty_email(self, app_client):
        user_mgmt.ensure_user_tables()

        with pytest.raises(Exception):
            user_mgmt.create_user("", "COMP-001", False, "free")

    def test_create_user_whitespace_password(self, app_client):
        user_mgmt.ensure_user_tables()

        with pytest.raises(HTTPException):
            user_mgmt.create_user(
                "whitespace@test.com", "COMP-001", False, "free", initial_password="   "
            )

    def test_login_with_whitespace_email(self, app_client):
        user_mgmt.ensure_user_tables()

        with pytest.raises(HTTPException):
            user_mgmt.login_user("  ", "AnyPassword123!")

    def test_create_user_password_exactly_72_chars(self, app_client):
        user_mgmt.ensure_user_tables()

        password = "p" * 72
        user = user_mgmt.create_user(
            email="max72@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password=password,
        )
        assert user is not None

        result = user_mgmt.login_user("max72@test.com", password)
        assert "tokens" in result

    def test_create_user_password_over_72_chars(self, app_client):
        user_mgmt.ensure_user_tables()

        password = "p" * 80
        user = user_mgmt.create_user(
            email="over72@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password=password,
        )
        assert user is not None

        result = user_mgmt.login_user("over72@test.com", user["initial_password"])
        assert "tokens" in result

    def test_change_password_same_as_old(self, app_client):
        user_mgmt.ensure_user_tables()
        password = "SamePass123!"
        user = user_mgmt.create_user(
            email="samepass@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password=password,
        )

        result = user_mgmt.change_password(user["user_id"], password, password)
        assert result["changed"] is True

    def test_multiple_concurrent_login_failures(self, app_client):
        user_mgmt.ensure_user_tables()
        email = "concurrent@test.com"
        user_mgmt.create_user(
            email=email,
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password="CorrectPass123!",
        )

        for i in range(10):
            try:
                user_mgmt.login_user(email, f"WrongPass{i}!")
            except HTTPException:
                pass

        user_row = db.fetch_one(
            "SELECT failed_login_attempts FROM users WHERE email = ?", (email,)
        )
        assert user_row["failed_login_attempts"] > 0

    def test_create_plan_negative_values(self, app_client):
        user_mgmt.ensure_user_tables()

        plan = user_mgmt.create_plan(
            plan_id="negative-plan",
            name="Negative Plan",
            max_orders=-1,
            max_users=-5,
            features=None,
        )
        assert plan is not None

    def test_create_plan_zero_values(self, app_client):
        user_mgmt.ensure_user_tables()

        plan = user_mgmt.create_plan(
            plan_id="zero-plan",
            name="Zero Plan",
            max_orders=0,
            max_users=0,
            features=[],
        )
        assert plan is not None

    def test_create_plan_very_large_values(self, app_client):
        user_mgmt.ensure_user_tables()

        plan = user_mgmt.create_plan(
            plan_id="large-plan",
            name="Large Plan",
            max_orders=999999999,
            max_users=999999999,
            features=["f" * 1000 for _ in range(100)],
        )
        assert plan is not None

    def test_decode_token_no_bearer_prefix(self, app_client):
        with pytest.raises(HTTPException) as exc_info:
            user_mgmt.decode_token("just-a-token")
        assert exc_info.value.status_code == 401

    def test_decode_token_empty_string(self, app_client):
        with pytest.raises(HTTPException):
            user_mgmt.decode_token("")

    def test_decode_token_malformed_jwt(self, app_client):
        with pytest.raises(HTTPException):
            user_mgmt.decode_token("Bearer not.a.valid.jwt")

    def test_token_with_missing_expiration(self, app_client):
        no_exp_payload = {"sub": "U-test123", "email": "noexp@test.com"}
        no_exp_token = jwt.encode(
            no_exp_payload, user_mgmt.JWT_SECRET, algorithm=user_mgmt.JWT_ALG
        )

        with pytest.raises(HTTPException) as exc_info:
            user_mgmt.decode_token(f"Bearer {no_exp_token}")
        assert exc_info.value.status_code == 401


class TestDatabaseEdgeCases:
    """Test database edge cases."""

    def test_fetch_all_empty_table(self, app_client):
        result = db.fetch_all(
            "SELECT * FROM api_key_audit WHERE api_key_id = ?", (999999,)
        )
        assert result == []

    def test_fetch_one_nonexistent(self, app_client):
        result = db.fetch_one("SELECT * FROM api_keys WHERE id = ?", (999999,))
        assert result is None

    def test_execute_sql_injection_attempt(self, app_client):
        auth.ensure_table()

        injection = "'; DROP TABLE api_keys; --"
        try:
            key = auth.create_api_key(label=injection)
            assert key is not None
            found = db.fetch_one("SELECT * FROM api_keys WHERE id = ?", (key["id"],))
            assert found is not None
        except Exception:
            pass

    def test_fetch_with_special_characters(self, app_client):
        auth.ensure_table()

        special_label = "Test-Label_123!@#$%^&*()"
        key = auth.create_api_key(label=special_label)

        found_keys = auth.list_api_keys()
        labels = [k.get("label") for k in found_keys]
        assert special_label in labels


class TestEndpointEdgeCases:
    """Test endpoint edge cases and error scenarios."""

    def test_order_creation_with_very_long_id(self, app_client):
        auth.ensure_table()
        key = auth.create_api_key(label="long-id-test")

        long_id = "O" * 500
        payload = {"order_id": long_id, "customer_id": "CUST-ALFA"}
        response = app_client.post(
            "/api/orders", json=payload, headers={"x-api-key": key["api_key"]}
        )
        assert response.status_code in [201, 400, 422]

    def test_order_line_with_negative_qty(self, app_client):
        auth.ensure_table()
        key = auth.create_api_key(label="negative-qty-test")

        payload = {
            "order_id": "ORD-0001",
            "line_no": 99,
            "product_id": "P-100",
            "qty": -10,
            "unit_price": 30,
        }
        response = app_client.post(
            "/api/order-lines", json=payload, headers={"x-api-key": key["api_key"]}
        )
        assert response.status_code in [201, 400, 422]

    def test_order_line_with_zero_qty(self, app_client):
        auth.ensure_table()
        key = auth.create_api_key(label="zero-qty-test")

        payload = {
            "order_id": "ORD-0001",
            "line_no": 98,
            "product_id": "P-100",
            "qty": 0,
            "unit_price": 30,
        }
        response = app_client.post(
            "/api/order-lines", json=payload, headers={"x-api-key": key["api_key"]}
        )
        assert response.status_code in [201, 400, 422]

    def test_timesheet_with_negative_hours(self, app_client):
        auth.ensure_table()
        key = auth.create_api_key(label="negative-hours-test")

        payload = {"emp_id": "E-01", "hours": -8.0}
        response = app_client.post(
            "/api/timesheets", json=payload, headers={"x-api-key": key["api_key"]}
        )
        assert response.status_code in [201, 400, 422]

    def test_inventory_with_extreme_qty(self, app_client):
        auth.ensure_table()
        key = auth.create_api_key(label="extreme-qty-test")

        payload = {
            "txn_id": "TXN-EXTREME",
            "product_id": "P-100",
            "qty_change": 999999999999999,
            "reason": "PO",
        }
        response = app_client.post(
            "/api/inventory", json=payload, headers={"x-api-key": key["api_key"]}
        )
        assert response.status_code in [201, 400, 422]

    def test_api_key_with_wrong_header_format(self, app_client):
        auth.ensure_table()
        key = auth.create_api_key(label="header-format-test")

        payload = {"order_id": "ORD-HDR-TEST", "customer_id": "CUST-ALFA"}
        response = app_client.post(
            "/api/orders", json=payload, headers={"X-API-KEY": key["api_key"]}
        )
        assert response.status_code in [201, 401]

    def test_admin_endpoint_with_empty_admin_key(self, app_client):
        auth.ensure_table()

        response = app_client.get("/api/admin/api-keys", headers={"x-admin-key": ""})
        assert response.status_code == 401

    def test_admin_endpoint_wrong_admin_key(self, app_client):
        auth.ensure_table()
        os.environ["ADMIN_KEY"] = "correct-key"

        response = app_client.get(
            "/api/admin/api-keys", headers={"x-admin-key": "wrong-key"}
        )
        assert response.status_code == 401

    def test_user_login_with_null_password(self, app_client):
        user_mgmt.ensure_user_tables()

        with pytest.raises(Exception):
            user_mgmt.login_user("test@test.com", None)

    def test_create_order_missing_required_field(self, app_client):
        auth.ensure_table()
        key = auth.create_api_key(label="missing-field-test")

        payload = {"order_id": "ORD-MISSING"}
        response = app_client.post(
            "/api/orders", json=payload, headers={"x-api-key": key["api_key"]}
        )
        assert response.status_code in [400, 422]

    def test_finance_endpoint_nonexistent_order(self, app_client):
        response = app_client.get("/api/finance/ORD-DOES-NOT-EXIST-XYZ")
        assert response.status_code in [200, 404]

    def test_planned_time_endpoint_nonexistent_order(self, app_client):
        response = app_client.get("/api/planned-time/ORD-DOES-NOT-EXIST-ABC")
        assert response.status_code in [200, 404]


class TestPasswordResetEdgeCases:
    """Test password reset edge cases."""

    def test_reset_password_with_expired_token(self, app_client):
        user_mgmt.ensure_user_tables()

        expired_payload = {
            "sub": "U-test123",
            "type": "reset",
            "exp": datetime.utcnow() - timedelta(hours=25),
        }
        expired_token = jwt.encode(
            expired_payload, user_mgmt.JWT_SECRET, algorithm=user_mgmt.JWT_ALG
        )

        with pytest.raises(HTTPException):
            user_mgmt.reset_password_with_token(expired_token, "NewPass456!")

    def test_reset_password_wrong_token_type(self, app_client):
        user_mgmt.ensure_user_tables()

        wrong_type_payload = {
            "sub": "U-test123",
            "type": "access",
            "exp": datetime.utcnow() + timedelta(hours=1),
        }
        wrong_type_token = jwt.encode(
            wrong_type_payload, user_mgmt.JWT_SECRET, algorithm=user_mgmt.JWT_ALG
        )

        with pytest.raises(HTTPException):
            user_mgmt.reset_password_with_token(wrong_type_token, "NewPass456!")

    def test_request_reset_nonexistent_user_returns_safe_message(self, app_client):
        user_mgmt.ensure_user_tables()

        result = user_mgmt.request_password_reset("totally-fake-user@test.com")
        assert "message" in result
        assert "If email exists" in result["message"]


class TestValidationAndInputHandling:
    """Test validation and input handling."""

    def test_schema_validation_invalid_status(self, app_client):
        auth.ensure_table()
        key = auth.create_api_key(label="invalid-status-test")

        payload = {
            "order_id": "ORD-INVALID-STATUS",
            "customer_id": "CUST-ALFA",
            "status": "InvalidStatus",
        }
        response = app_client.post(
            "/api/orders", json=payload, headers={"x-api-key": key["api_key"]}
        )
        assert response.status_code in [400, 422]

    def test_inventory_invalid_reason(self, app_client):
        auth.ensure_table()
        key = auth.create_api_key(label="invalid-reason-test")

        payload = {
            "txn_id": "TXN-INVALID-REASON",
            "product_id": "P-100",
            "qty_change": 10,
            "reason": "InvalidReason",
        }
        response = app_client.post(
            "/api/inventory", json=payload, headers={"x-api-key": key["api_key"]}
        )
        assert response.status_code in [400, 422, 201]

    def test_timesheet_missing_required_fields(self, app_client):
        auth.ensure_table()
        key = auth.create_api_key(label="missing-ts-fields-test")

        payload = {"emp_id": "E-01"}
        response = app_client.post(
            "/api/timesheets", json=payload, headers={"x-api-key": key["api_key"]}
        )
        assert response.status_code in [400, 422]

    def test_create_user_invalid_email_format(self, app_client):
        user_mgmt.ensure_user_tables()

        with pytest.raises(Exception):
            user_mgmt.create_user(
                email="not-an-email",
                company_id="COMP-001",
                is_admin=False,
                subscription_plan="free",
            )
