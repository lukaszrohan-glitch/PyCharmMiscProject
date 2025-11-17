import pytest
import auth
import db
import os
import binascii
from datetime import datetime, timedelta


class TestKeyHashing:
    """Test API key hashing and verification functions."""

    def test_hash_key_generates_different_salts(self):
        plaintext = "test-key-12345"
        hash1, salt1 = auth._hash_key(plaintext)
        hash2, salt2 = auth._hash_key(plaintext)
        
        assert hash1 != hash2, "Different salts should generate different hashes"
        assert salt1 != salt2, "Different calls should generate different salts"

    def test_hash_key_with_provided_salt(self):
        plaintext = "test-key"
        import secrets
        salt = secrets.token_bytes(auth.SALT_BYTES)
        hash1, salt1 = auth._hash_key(plaintext, salt)
        hash2, salt2 = auth._hash_key(plaintext, salt)
        
        assert hash1 == hash2, "Same salt should produce same hash"
        assert salt1 == salt2, "Salt should be preserved"

    def test_verify_key_success(self):
        plaintext = "my-secret-api-key"
        key_hash, salt = auth._hash_key(plaintext)
        
        is_valid = auth._verify_key(plaintext, key_hash, salt)
        assert is_valid is True

    def test_verify_key_failure_wrong_password(self):
        plaintext = "correct-key"
        wrong_plaintext = "wrong-key"
        key_hash, salt = auth._hash_key(plaintext)
        
        is_valid = auth._verify_key(wrong_plaintext, key_hash, salt)
        assert is_valid is False

    def test_verify_key_failure_corrupted_hash(self):
        plaintext = "test-key"
        key_hash, salt = auth._hash_key(plaintext)
        
        corrupted_hash = "a" * len(key_hash)
        is_valid = auth._verify_key(plaintext, corrupted_hash, salt)
        assert is_valid is False

    def test_hash_key_deterministic_with_salt(self):
        plaintext = "deterministic-test"
        import secrets
        salt_bytes = secrets.token_bytes(auth.SALT_BYTES)
        
        hash1, salt1 = auth._hash_key(plaintext, salt_bytes)
        hash2, salt2 = auth._hash_key(plaintext, salt_bytes)
        
        assert hash1 == hash2
        assert salt1 == salt2


class TestApiKeyLifecycle:
    """Test complete API key creation, retrieval, deletion, and rotation."""

    def test_create_api_key_basic(self, app_client):
        auth.ensure_table()
        row = auth.create_api_key(label="test-key-1")
        
        assert row is not None
        assert "api_key" in row, "Plaintext key should be returned on creation"
        assert "id" in row
        assert row["label"] == "test-key-1"
        assert row["active"] is True or row["active"] == 1

    def test_create_api_key_without_label(self, app_client):
        auth.ensure_table()
        row = auth.create_api_key()
        
        assert row is not None
        assert "api_key" in row
        assert "id" in row

    def test_list_api_keys(self, app_client):
        auth.ensure_table()
        auth.create_api_key(label="key-1")
        auth.create_api_key(label="key-2")
        
        keys = auth.list_api_keys()
        assert isinstance(keys, list)
        assert len(keys) >= 2
        labels = [k.get("label") for k in keys]
        assert "key-1" in labels
        assert "key-2" in labels

    def test_get_api_key_by_plaintext(self, app_client):
        auth.ensure_table()
        created = auth.create_api_key(label="retrieve-test")
        plaintext = created["api_key"]
        
        found = auth.get_api_key(plaintext)
        assert found is not None
        assert found["id"] == created["id"]
        assert found["label"] == "retrieve-test"

    def test_get_api_key_invalid(self, app_client):
        auth.ensure_table()
        found = auth.get_api_key("nonexistent-key-xyz")
        assert found is None

    def test_delete_api_key_by_id(self, app_client):
        auth.ensure_table()
        created = auth.create_api_key(label="delete-test")
        key_id = created["id"]
        
        deleted = auth.delete_api_key_by_id(key_id)
        assert deleted is not None
        assert deleted["id"] == key_id
        
        found = auth.get_api_key(created["api_key"])
        assert found is None

    def test_delete_api_key_by_keytext(self, app_client):
        auth.ensure_table()
        created = auth.create_api_key(label="delete-by-text-test")
        plaintext = created["api_key"]
        
        deleted = auth.delete_api_key_by_keytext(plaintext)
        assert deleted is not None
        
        found = auth.get_api_key(plaintext)
        assert found is None

    def test_rotate_api_key(self, app_client):
        auth.ensure_table()
        original = auth.create_api_key(label="rotate-test")
        original_id = original["id"]
        original_plaintext = original["api_key"]
        
        rotated = auth.rotate_api_key(original_id, by="admin")
        assert rotated is not None
        assert "api_key" in rotated
        assert rotated["api_key"] != original_plaintext
        
        original_found = auth.get_api_key(original_plaintext)
        assert original_found is None
        
        new_found = auth.get_api_key(rotated["api_key"])
        assert new_found is not None

    def test_mark_last_used(self, app_client):
        auth.ensure_table()
        created = auth.create_api_key(label="last-used-test")
        key_id = created["id"]
        
        auth.mark_last_used(key_id)
        
        found = auth.get_api_key(created["api_key"])
        assert found is not None
        assert found["last_used"] is not None or found.get("last_used")


class TestApiKeyAudit:
    """Test API key audit logging."""

    def test_log_api_key_event_basic(self, app_client):
        auth.ensure_table()
        created = auth.create_api_key(label="audit-test")
        key_id = created["id"]
        
        auth.log_api_key_event(key_id, "test-event", event_by="test-user")
        
        rows = db.fetch_all("SELECT * FROM api_key_audit WHERE api_key_id = ?", (key_id,))
        assert len(rows) > 0
        audit_row = rows[0]
        assert audit_row["event_type"] == "test-event"
        assert audit_row["event_by"] == "test-user"

    def test_log_api_key_event_with_details(self, app_client):
        auth.ensure_table()
        created = auth.create_api_key(label="audit-details-test")
        key_id = created["id"]
        
        details = {"reason": "testing", "source": "unit-test"}
        auth.log_api_key_event(key_id, "detailed-event", event_by="test", details=details)
        
        rows = db.fetch_all("SELECT * FROM api_key_audit WHERE api_key_id = ?", (key_id,))
        assert len(rows) > 0
        audit_row = rows[0]
        assert audit_row["event_type"] == "detailed-event"
        assert audit_row["details"] is not None

    def test_log_api_key_event_without_key_id(self, app_client):
        auth.ensure_table()
        
        auth.log_api_key_event(None, "orphan-event", event_by="test")
        
        rows = db.fetch_all("SELECT * FROM api_key_audit WHERE api_key_id IS NULL ORDER BY event_time DESC LIMIT 1")
        assert len(rows) > 0

    def test_audit_contains_timestamp(self, app_client):
        auth.ensure_table()
        created = auth.create_api_key(label="timestamp-test")
        key_id = created["id"]
        
        before = datetime.utcnow()
        auth.log_api_key_event(key_id, "timestamped-event")
        after = datetime.utcnow()
        
        rows = db.fetch_all("SELECT * FROM api_key_audit WHERE api_key_id = ?", (key_id,))
        assert len(rows) > 0
        assert rows[0]["event_time"] is not None


class TestEnsureTable:
    """Test table creation."""

    def test_ensure_table_creates_tables(self, app_client):
        auth.ensure_table()
        
        keys_exist = db.fetch_one("SELECT name FROM sqlite_master WHERE type='table' AND name='api_keys'")
        audit_exists = db.fetch_one("SELECT name FROM sqlite_master WHERE type='table' AND name='api_key_audit'")
        
        assert keys_exist is not None
        assert audit_exists is not None

    def test_ensure_table_idempotent(self, app_client):
        auth.ensure_table()
        auth.ensure_table()
        
        keys = auth.list_api_keys()
        assert isinstance(keys, list)
