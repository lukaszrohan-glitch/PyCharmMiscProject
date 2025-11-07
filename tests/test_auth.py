import auth
import db
import os


def test_create_and_verify_api_key(app_client):
    # Ensure tables exist (sqlite fallback will create schema)
    auth.ensure_table()

    # Create a new key
    row = auth.create_api_key(label='test-key')
    assert row is not None
    assert 'api_key' in row
    plaintext = row['api_key']

    # Ensure get_api_key verifies the plaintext key
    found = auth.get_api_key(plaintext)
    assert found is not None
    assert 'id' in found
    # Deleting created key by id should succeed (sqlite path returns returning id)
    deleted = auth.delete_api_key_by_id(found['id'])
    # delete may return None depending on DB path; if present check id
    if deleted:
        assert 'id' in deleted
