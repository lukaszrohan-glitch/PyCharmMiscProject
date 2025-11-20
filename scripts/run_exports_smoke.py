import sys
import pathlib
ROOT = pathlib.Path().resolve()
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
import main

# Monkeypatch db.fetch_all at module level
import routers.inventory as inventory
import routers.orders as orders
import routers.timesheets as timesheets

SAMPLE_INVENTORY = [
    {"txn_id": "T1", "txn_date": "2025-11-01", "product_id": "P1", "qty_change": "10", "reason": "PO", "lot": "L1", "location": "W1"}
]

SAMPLE_ORDERS = [
    {"order_id": "O1", "customer_id": "C1", "status": "Planned", "order_date": "2025-11-01", "due_date": "2025-11-10", "contact_person": "John"}
]

SAMPLE_TIMESHEETS = [
    {"ts_id": 1, "emp_id": "E1", "ts_date": "2025-11-01", "order_id": "O1", "operation_no": 1, "hours": 8, "notes": "", "approved": 0, "approved_by": None, "approved_at": None}
]

inventory.fetch_all = lambda sql, params=None: SAMPLE_INVENTORY
orders.fetch_all = lambda sql, params=None: SAMPLE_ORDERS
timesheets.fetch_all = lambda sql, params=None: SAMPLE_TIMESHEETS

client = TestClient(main.app)

paths = [
    ("/api/inventory/export", "inventory.csv"),
    ("/api/orders/export", "orders.csv"),
    ("/api/timesheets/export.csv", "timesheets.csv"),
]

for path, fname in paths:
    print(f"GET {path}")
    r = client.get(path)
    print(r.status_code)
    if r.status_code == 200:
        text = r.content.decode('utf-8', errors='replace')
        print('HEAD:', text[:200])
        with open(fname, 'wb') as f:
            f.write(r.content)
        print(f'Wrote {fname} {len(r.content)} bytes')
    else:
        print('Response:', r.text)

print('Done')
