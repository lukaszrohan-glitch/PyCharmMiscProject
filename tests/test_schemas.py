from schemas import OrderCreate, OrderLineCreate, TimesheetCreate, InventoryCreate, OrderStatus, InventoryReason
from datetime import date
from decimal import Decimal


def test_order_create_basic():
    o = OrderCreate(order_id='ORD-000X', customer_id='CUST-TEST')
    assert o.order_id == 'ORD-000X'
    assert o.status == OrderStatus.New


def test_order_line_discount_normalize():
    ol = OrderLineCreate(order_id='ORD-000X', line_no=1, product_id='P-100', qty=10, unit_price=5, discount_pct='0.05')
    assert ol.discount_pct == Decimal('0.05')


def test_timesheet():
    ts = TimesheetCreate(emp_id='E-01', hours=3.5)
    assert ts.emp_id == 'E-01'


def test_inventory_reason_enum():
    inv = InventoryCreate(txn_id='T1', product_id='P-100', qty_change=10, reason=InventoryReason.PO)
    assert inv.reason == InventoryReason.PO
