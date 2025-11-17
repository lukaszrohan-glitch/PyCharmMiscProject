import pytest
import os
import auth
import user_mgmt
from decimal import Decimal


class TestHealthEndpoints:
    """Test health check endpoints."""

    def test_healthz_endpoint(self, app_client):
        response = app_client.get("/healthz")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True

    def test_api_healthz_endpoint(self, app_client):
        response = app_client.get("/api/healthz")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True


class TestOrdersReadEndpoints:
    """Test order reading endpoints."""

    def test_orders_list_success(self, app_client):
        response = app_client.get("/api/orders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            order = data[0]
            assert "order_id" in order
            assert "customer_id" in order

    def test_orders_list_empty_or_populated(self, app_client):
        response = app_client.get("/api/orders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestFinanceEndpoints:
    """Test finance-related endpoints."""

    def test_finance_one_existing_order(self, app_client):
        response = app_client.get("/api/finance/ORD-0001")
        assert response.status_code == 200
        data = response.json()
        if data:
            assert "order_id" in data
            assert "revenue" in data

    def test_finance_one_nonexistent_order(self, app_client):
        response = app_client.get("/api/finance/NONEXISTENT-ORD")
        assert response.status_code == 200 or response.status_code == 404


class TestShortagesEndpoint:
    """Test shortages endpoint."""

    def test_shortages_list(self, app_client):
        response = app_client.get("/api/shortages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestPlannedTimeEndpoint:
    """Test planned time endpoint."""

    def test_planned_time_existing_order(self, app_client):
        response = app_client.get("/api/planned-time/ORD-0001")
        assert response.status_code == 200 or response.status_code == 404
        if response.status_code == 200:
            data = response.json()
            assert "order_id" in data

    def test_planned_time_nonexistent_order(self, app_client):
        response = app_client.get("/api/planned-time/NONEXISTENT-PLAN")
        assert response.status_code == 404


class TestProductsAndCustomersEndpoints:
    """Test products and customers listing."""

    def test_products_list(self, app_client):
        response = app_client.get("/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            product = data[0]
            assert "product_id" in product

    def test_customers_list(self, app_client):
        response = app_client.get("/api/customers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            customer = data[0]
            assert "customer_id" in customer


class TestOrderCreationEndpoint:
    """Test order creation endpoint."""

    def test_create_order_without_api_key(self, app_client):
        payload = {
            "order_id": "ORD-NEW-001",
            "customer_id": "CUST-ALFA",
            "status": "Planned",
            "due_date": "2025-12-31"
        }
        response = app_client.post("/api/orders", json=payload)
        assert response.status_code == 401

    def test_create_order_with_valid_api_key(self, app_client):
        auth.ensure_table()
        created_key = auth.create_api_key(label="test-key-create-order")
        api_key = created_key["api_key"]
        
        payload = {
            "order_id": "ORD-TEST-CREATE",
            "customer_id": "CUST-ALFA"
        }
        response = app_client.post(
            "/api/orders",
            json=payload,
            headers={"x-api-key": api_key}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["order_id"] == "ORD-TEST-CREATE"

    def test_create_order_duplicate_id_fails(self, app_client):
        auth.ensure_table()
        created_key = auth.create_api_key(label="test-key-duplicate")
        api_key = created_key["api_key"]
        
        payload = {
            "order_id": "ORD-DUP-TEST",
            "customer_id": "CUST-ALFA"
        }
        
        response1 = app_client.post(
            "/api/orders",
            json=payload,
            headers={"x-api-key": api_key}
        )
        assert response1.status_code == 201
        
        response2 = app_client.post(
            "/api/orders",
            json=payload,
            headers={"x-api-key": api_key}
        )
        assert response2.status_code == 409

    def test_create_order_with_env_api_key(self, app_client):
        os.environ["API_KEYS"] = "test-env-key-123"
        
        payload = {
            "order_id": "ORD-ENV-KEY",
            "customer_id": "CUST-ALFA"
        }
        response = app_client.post(
            "/api/orders",
            json=payload,
            headers={"x-api-key": "test-env-key-123"}
        )
        assert response.status_code == 201


class TestOrderLineCreationEndpoint:
    """Test order line creation endpoint."""

    def test_create_order_line_without_api_key(self, app_client):
        payload = {
            "order_id": "ORD-0001",
            "line_no": 99,
            "product_id": "P-100",
            "qty": 10,
            "unit_price": 30
        }
        response = app_client.post("/api/order-lines", json=payload)
        assert response.status_code == 401

    def test_create_order_line_with_api_key(self, app_client):
        auth.ensure_table()
        created_key = auth.create_api_key(label="test-key-orderline")
        api_key = created_key["api_key"]
        
        payload = {
            "order_id": "ORD-0001",
            "line_no": 99,
            "product_id": "P-100",
            "qty": 10,
            "unit_price": 30,
            "discount_pct": 0.05
        }
        response = app_client.post(
            "/api/order-lines",
            json=payload,
            headers={"x-api-key": api_key}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["line_no"] == 99


class TestTimesheetCreationEndpoint:
    """Test timesheet creation endpoint."""

    def test_create_timesheet_without_api_key(self, app_client):
        payload = {
            "emp_id": "E-01",
            "hours": 8.0
        }
        response = app_client.post("/api/timesheets", json=payload)
        assert response.status_code == 401

    def test_create_timesheet_with_api_key(self, app_client):
        auth.ensure_table()
        created_key = auth.create_api_key(label="test-key-timesheet")
        api_key = created_key["api_key"]
        
        payload = {
            "emp_id": "E-01",
            "hours": 8.5,
            "order_id": "ORD-0001",
            "operation_no": 1
        }
        response = app_client.post(
            "/api/timesheets",
            json=payload,
            headers={"x-api-key": api_key}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["hours"] == 8.5


class TestInventoryCreationEndpoint:
    """Test inventory transaction creation endpoint."""

    def test_create_inventory_without_api_key(self, app_client):
        payload = {
            "txn_id": "TXN-001",
            "product_id": "P-100",
            "qty_change": 100,
            "reason": "PO"
        }
        response = app_client.post("/api/inventory", json=payload)
        assert response.status_code == 401

    def test_create_inventory_with_api_key(self, app_client):
        auth.ensure_table()
        created_key = auth.create_api_key(label="test-key-inventory")
        api_key = created_key["api_key"]
        
        payload = {
            "txn_id": "TXN-NEW-001",
            "product_id": "P-100",
            "qty_change": 50,
            "reason": "PO"
        }
        response = app_client.post(
            "/api/inventory",
            json=payload,
            headers={"x-api-key": api_key}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["txn_id"] == "TXN-NEW-001"


class TestAuthLoginEndpoint:
    """Test user login endpoint."""

    def test_login_success(self, app_client):
        user_mgmt.ensure_user_tables()
        password = "LoginTest123!"
        user_mgmt.create_user(
            email="login@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password=password
        )
        
        payload = {
            "email": "login@test.com",
            "password": password
        }
        response = app_client.post("/api/auth/login", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "tokens" in data
        assert "user" in data
        assert data["user"]["email"] == "login@test.com"

    def test_login_invalid_email(self, app_client):
        payload = {
            "email": "nonexistent@test.com",
            "password": "AnyPassword123!"
        }
        response = app_client.post("/api/auth/login", json=payload)
        assert response.status_code == 401

    def test_login_wrong_password(self, app_client):
        user_mgmt.ensure_user_tables()
        user_mgmt.create_user(
            email="wrongpwd@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password="CorrectPass123!"
        )
        
        payload = {
            "email": "wrongpwd@test.com",
            "password": "WrongPass123!"
        }
        response = app_client.post("/api/auth/login", json=payload)
        assert response.status_code == 401


class TestUserProfileEndpoint:
    """Test user profile endpoint."""

    def test_profile_success(self, app_client):
        user_mgmt.ensure_user_tables()
        password = "ProfileTest123!"
        user_mgmt.create_user(
            email="profile@test.com",
            company_id="COMP-001",
            is_admin=True,
            subscription_plan="pro",
            initial_password=password
        )
        
        login_resp = app_client.post(
            "/api/auth/login",
            json={"email": "profile@test.com", "password": password}
        )
        token = login_resp.json()["tokens"]["access_token"]
        
        response = app_client.get(
            "/api/user/profile",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "profile@test.com"
        assert data["is_admin"] is True or data["is_admin"] == 1

    def test_profile_missing_token(self, app_client):
        response = app_client.get("/api/user/profile")
        assert response.status_code == 401


class TestChangePasswordEndpoint:
    """Test change password endpoint."""

    def test_change_password_success(self, app_client):
        user_mgmt.ensure_user_tables()
        old_password = "OldPass123!"
        new_password = "NewPass456!"
        user_mgmt.create_user(
            email="changepwd@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password=old_password
        )
        
        login_resp = app_client.post(
            "/api/auth/login",
            json={"email": "changepwd@test.com", "password": old_password}
        )
        token = login_resp.json()["tokens"]["access_token"]
        
        payload = {
            "old_password": old_password,
            "new_password": new_password
        }
        response = app_client.post(
            "/api/auth/change-password",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert response.json()["changed"] is True


class TestPasswordResetEndpoints:
    """Test password reset endpoints."""

    def test_request_reset_success(self, app_client):
        user_mgmt.ensure_user_tables()
        user_mgmt.create_user(
            email="resetreq@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free"
        )
        
        response = app_client.post(
            "/api/auth/request-reset",
            json={"email": "resetreq@test.com"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "reset_token" in data or "message" in data

    def test_reset_with_token_success(self, app_client):
        user_mgmt.ensure_user_tables()
        old_password = "OldTokenPass123!"
        user_mgmt.create_user(
            email="tokenreset@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password=old_password
        )
        
        reset_resp = app_client.post(
            "/api/auth/request-reset",
            json={"email": "tokenreset@test.com"}
        )
        reset_token = reset_resp.json()["reset_token"]
        
        new_password = "NewTokenPass456!"
        response = app_client.post(
            "/api/auth/reset",
            json={"token": reset_token, "new_password": new_password}
        )
        assert response.status_code == 200
        assert response.json()["changed"] is True


class TestAdminCreateUserEndpoint:
    """Test admin user creation endpoint."""

    def test_admin_create_user_success(self, app_client):
        user_mgmt.ensure_user_tables()
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@arkuszowniasmb.pl')
        admin_password = os.getenv('ADMIN_PASSWORD', 'SMB#Admin2025!')
        
        login_resp = app_client.post(
            "/api/auth/login",
            json={"email": admin_email, "password": admin_password}
        )
        if login_resp.status_code == 200:
            token = login_resp.json()["tokens"]["access_token"]
            
            payload = {
                "email": "newadminuser@test.com",
                "company_id": "COMP-002",
                "is_admin": False,
                "subscription_plan": "pro"
            }
            response = app_client.post(
                "/api/admin/users",
                json=payload,
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200

    def test_admin_create_user_non_admin(self, app_client):
        user_mgmt.ensure_user_tables()
        password = "NonAdminPass123!"
        user_mgmt.create_user(
            email="nonadmin@test.com",
            company_id="COMP-001",
            is_admin=False,
            subscription_plan="free",
            initial_password=password
        )
        
        login_resp = app_client.post(
            "/api/auth/login",
            json={"email": "nonadmin@test.com", "password": password}
        )
        token = login_resp.json()["tokens"]["access_token"]
        
        payload = {
            "email": "restricted@test.com",
            "company_id": "COMP-001",
            "is_admin": False,
            "subscription_plan": "free"
        }
        response = app_client.post(
            "/api/admin/users",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403


class TestAdminListUsersEndpoint:
    """Test admin list users endpoint."""

    def test_admin_list_users_success(self, app_client):
        user_mgmt.ensure_user_tables()
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@arkuszowniasmb.pl')
        admin_password = os.getenv('ADMIN_PASSWORD', 'SMB#Admin2025!')
        
        login_resp = app_client.post(
            "/api/auth/login",
            json={"email": admin_email, "password": admin_password}
        )
        if login_resp.status_code == 200:
            token = login_resp.json()["tokens"]["access_token"]
            
            response = app_client.get(
                "/api/admin/users",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)


class TestSubscriptionPlansEndpoints:
    """Test subscription plan admin endpoints."""

    def test_admin_create_plan_success(self, app_client):
        user_mgmt.ensure_user_tables()
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@arkuszowniasmb.pl')
        admin_password = os.getenv('ADMIN_PASSWORD', 'SMB#Admin2025!')
        
        login_resp = app_client.post(
            "/api/auth/login",
            json={"email": admin_email, "password": admin_password}
        )
        if login_resp.status_code == 200:
            token = login_resp.json()["tokens"]["access_token"]
            
            payload = {
                "plan_id": "plan-test-001",
                "name": "Test Plan",
                "max_orders": 100,
                "max_users": 5,
                "features": ["export", "api"]
            }
            response = app_client.post(
                "/api/admin/subscription-plans",
                json=payload,
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200

    def test_admin_list_plans_success(self, app_client):
        user_mgmt.ensure_user_tables()
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@arkuszowniasmb.pl')
        admin_password = os.getenv('ADMIN_PASSWORD', 'SMB#Admin2025!')
        
        login_resp = app_client.post(
            "/api/auth/login",
            json={"email": admin_email, "password": admin_password}
        )
        if login_resp.status_code == 200:
            token = login_resp.json()["tokens"]["access_token"]
            
            response = app_client.get(
                "/api/admin/subscription-plans",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)


class TestAdminApiKeyEndpoints:
    """Test admin API key management endpoints."""

    def test_admin_list_keys_without_admin_key(self, app_client):
        response = app_client.get("/api/admin/api-keys")
        assert response.status_code == 401

    def test_admin_list_keys_with_admin_key(self, app_client):
        auth.ensure_table()
        os.environ['ADMIN_KEY'] = 'test-admin-key'
        
        response = app_client.get(
            "/api/admin/api-keys",
            headers={"x-admin-key": "test-admin-key"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_admin_create_key_with_admin_key(self, app_client):
        auth.ensure_table()
        os.environ['ADMIN_KEY'] = 'test-admin-key'
        
        payload = {"label": "admin-created-key"}
        response = app_client.post(
            "/api/admin/api-keys",
            json=payload,
            headers={"x-admin-key": "test-admin-key"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "api_key" in data

    def test_admin_rotate_key_with_admin_key(self, app_client):
        auth.ensure_table()
        os.environ['ADMIN_KEY'] = 'test-admin-key'
        
        created = auth.create_api_key(label="rotate-test")
        key_id = created["id"]
        
        response = app_client.post(
            f"/api/admin/api-keys/{key_id}/rotate",
            headers={"x-admin-key": "test-admin-key"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "api_key" in data

    def test_admin_delete_key_with_admin_key(self, app_client):
        auth.ensure_table()
        os.environ['ADMIN_KEY'] = 'test-admin-key'
        
        created = auth.create_api_key(label="delete-test")
        key_id = created["id"]
        
        response = app_client.delete(
            f"/api/admin/api-keys/{key_id}",
            headers={"x-admin-key": "test-admin-key"}
        )
        assert response.status_code == 200

    def test_admin_api_key_audit(self, app_client):
        auth.ensure_table()
        os.environ['ADMIN_KEY'] = 'test-admin-key'
        
        response = app_client.get(
            "/api/admin/api-key-audit",
            headers={"x-admin-key": "test-admin-key"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_admin_purge_audit(self, app_client):
        auth.ensure_table()
        os.environ['ADMIN_KEY'] = 'test-admin-key'
        
        response = app_client.delete(
            "/api/admin/api-key-audit?days=30",
            headers={"x-admin-key": "test-admin-key"}
        )
        assert response.status_code == 200
