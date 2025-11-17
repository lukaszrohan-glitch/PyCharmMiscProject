import os
import time
from fastapi.testclient import TestClient
import main
import auth
import db


def test_rotate_and_purge_audit(app_client):
    # ensure tables
    auth.ensure_table()
    # set an admin key for this test
    os.environ['ADMIN_KEY'] = 'test-admin'
    # create a key via auth.create_api_key
    row = auth.create_api_key(label='rotate-test')
    assert row and 'id' in row
    key_id = row['id']

    # rotate the key via admin endpoint
    resp = app_client.post(f"/admin/api-keys/{key_id}/rotate", headers={ 'x-admin-key': 'test-admin' })
    assert resp.status_code == 200
    data = resp.json()
    assert 'api_key' in data

    # log a manual audit event
    auth.log_api_key_event(key_id, 'test-event', event_by='test')

    # fetch audit entries
    resp = app_client.get('/admin/api-key-audit', headers={ 'x-admin-key': 'test-admin' })
    assert resp.status_code == 200
    rows = resp.json()
    assert isinstance(rows, list)
    assert len(rows) > 0

    # purge audit older than 0 days (should delete all entries)
    resp = app_client.delete('/admin/api-key-audit?days=0', headers={ 'x-admin-key': 'test-admin' })
    assert resp.status_code == 200
    assert resp.json().get('purged') is True

    # verify audit list is empty
    resp = app_client.get('/admin/api-key-audit', headers={ 'x-admin-key': 'test-admin' })
    assert resp.status_code == 200
    assert resp.json() == []
