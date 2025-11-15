# python
# file: `queries.py`

# READS
SQL_ORDERS = """
SELECT order_id, customer_id, status, due_date, order_date
FROM orders
ORDER BY order_date DESC, order_id;
"""

SQL_FINANCE_ONE = """
SELECT order_id, revenue, material_cost, labor_cost, gross_margin
FROM v_order_finance
WHERE order_id = %s;
"""

SQL_SHORTAGES = """
SELECT order_id, component_id, required_qty, qty_on_hand, shortage_qty
FROM v_shortages
ORDER BY order_id, component_id;
"""

SQL_PLANNED_ONE = """
SELECT order_id, planned_hours
FROM v_planned_time
WHERE order_id = %s;
"""

SQL_PRODUCTS = """
SELECT product_id, name, unit, std_cost, price, vat_rate 
FROM products 
ORDER BY product_id;
"""

SQL_CUSTOMERS = """
SELECT customer_id, name, nip, address, email 
FROM customers 
ORDER BY customer_id;
"""

# WRITES with proper constraints
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

# Indexes for performance
SQL_CREATE_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_order_lines_product ON order_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_emp ON timesheets(emp_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_order ON timesheets(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_date ON inventory(txn_date);
"""
