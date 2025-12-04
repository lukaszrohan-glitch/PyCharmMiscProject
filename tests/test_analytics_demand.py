import os
from fastapi.testclient import TestClient
from types import SimpleNamespace

os.environ.setdefault('JWT_SECRET', 'd2e03a79c45b0cdaee1c9fa7a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f506172839405162738495a0b1c2d3')
os.environ.setdefault('ADMIN_KEY', 'test-admin')
os.environ.setdefault('FORCE_SQLITE', '1')

from main import app
import routers.analytics as analytics_router

client = TestClient(app)

def make_headers():
    return {'Authorization': 'Bearer test'}


def _fake_require_auth(_authorization: str = 'Bearer test'):
    return SimpleNamespace(user_id='u-test', email='test@example.com', is_admin=True)


def test_create_list_forecast(monkeypatch):
    app.dependency_overrides[analytics_router.require_auth] = lambda: _fake_require_auth()
    resp = client.post('/api/analytics/demand/scenarios', json={
        'name': 'Baseline 2026',
        'multiplier': 1.2,
        'backlog_weeks': 6
    }, headers=make_headers())
    assert resp.status_code == 201, resp.text
    scenario = resp.json()

    list_resp = client.get('/api/analytics/demand/scenarios', headers=make_headers())
    assert list_resp.status_code == 200
    assert any(item['scenario_id'] == scenario['scenario_id'] for item in list_resp.json())

    forecast_resp = client.post('/api/analytics/demand', json={'scenario_id': scenario['scenario_id']}, headers=make_headers())
    assert forecast_resp.status_code == 200
    payload = forecast_resp.json()
    assert payload['scenario']['name'] == 'Baseline 2026'
    assert payload['revenue'] >= 0
    app.dependency_overrides.pop(analytics_router.require_auth, None)
