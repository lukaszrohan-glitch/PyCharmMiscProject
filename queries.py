# python
# file: `queries.py`

# READS
SQL_ORDERS = """
SELECT order_id, customer_id, status, due_date, order_date
FROM orders
ORDER BY order_date DESC, order_id;
"""

SQL_FINANCE_ONE = """
-- TODO: replace '*' with explicit column list from v_order_finance for stability/performance
SELECT *
FROM v_order_finance
WHERE order_id = %s;
"""

SQL_SHORTAGES = """
SELECT order_id, component_id, required_qty, qty_on_hand, shortage_qty
FROM v_shortages
ORDER BY order_id, component_id;
"""

SQL_PLANNED_ONE = """
-- TODO: replace '*' with explicit column list from v_planned_time for stability/performance
SELECT *
FROM v_planned_time
WHERE order_id = %s;
"""

SQL_PRODUCTS = """
SELECT product_id, name, unit, std_cost, price, vat_rate FROM products ORDER BY product_id;
"""

SQL_CUSTOMERS = """
SELECT customer_id, name, nip, address, email FROM customers ORDER BY customer_id;
"""

# WRITES
SQL_INSERT_ORDER = """
INSERT INTO orders (order_id, order_date, customer_id, status, due_date)
VALUES (%s, CURRENT_DATE, %s, %s, %s)
ON CONFLICT (order_id) DO NOTHING
RETURNING order_id, customer_id, status, due_date;
"""

SQL_INSERT_ORDER_LINE = """
INSERT INTO order_lines (order_id, line_no, product_id, qty, unit_price, discount_pct, graphic_id)
VALUES (%s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (order_id, line_no) DO NOTHING
RETURNING order_id, line_no, product_id, qty, unit_price, discount_pct, graphic_id;
"""

SQL_INSERT_TIMESHEET = """
INSERT INTO timesheets (emp_id, ts_date, order_id, operation_no, hours, notes)
VALUES (%s, COALESCE(%s, CURRENT_DATE), %s, %s, %s, %s)
RETURNING ts_id, emp_id, ts_date, order_id, operation_no, hours, notes;
"""

SQL_INSERT_INVENTORY = """
INSERT INTO inventory (txn_id, txn_date, product_id, qty_change, reason, lot, location)
VALUES (%s, COALESCE(%s, CURRENT_DATE), %s, %s, %s, %s, %s)
RETURNING txn_id, txn_date, product_id, qty_change, reason, lot, location;
"""