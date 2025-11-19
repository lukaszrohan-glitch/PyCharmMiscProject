# python
# file: `queries.py`

# READS
SQL_ORDERS = """
SELECT order_id, customer_id, status, due_date, order_date, contact_person
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
SELECT customer_id, name, nip, address, email, contact_person 
FROM customers 
ORDER BY customer_id;
"""

# WRITES with proper constraints
SQL_INSERT_ORDER = """
INSERT INTO orders (order_id, order_date, customer_id, status, due_date, contact_person)
VALUES (%s, CURRENT_DATE, %s, %s, %s, %s)
ON CONFLICT (order_id) DO NOTHING
RETURNING order_id, customer_id, status, order_date, due_date, contact_person;
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

# ANALYTICS QUERIES
SQL_REVENUE_BY_MONTH = """
SELECT
  DATE_TRUNC('month', order_date)::date AS month,
  SUM(revenue) AS revenue,
  SUM(gross_margin) AS margin
FROM v_order_finance
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY DATE_TRUNC('month', order_date);
"""

SQL_TOP_CUSTOMERS = """
SELECT
  c.customer_id,
  c.name,
  SUM(f.revenue) AS revenue,
  SUM(f.gross_margin) AS margin,
  COUNT(DISTINCT f.order_id) AS orders_count
FROM v_order_finance f
JOIN customers c ON c.customer_id = f.customer_id
WHERE (%s IS NULL OR f.order_date >= %s)
  AND (%s IS NULL OR f.order_date <= %s)
GROUP BY c.customer_id, c.name
ORDER BY revenue DESC
LIMIT %s;
"""

SQL_TOP_ORDERS = """
SELECT
  f.order_id,
  f.customer_id,
  c.name AS customer_name,
  f.revenue,
  f.gross_margin AS margin
FROM v_order_finance f
LEFT JOIN customers c ON c.customer_id = f.customer_id
WHERE (%s IS NULL OR f.order_date >= %s)
  AND (%s IS NULL OR f.order_date <= %s)
ORDER BY f.revenue DESC
LIMIT %s;
"""

SQL_ANALYTICS_SUMMARY = """
WITH period AS (
  SELECT
    COALESCE(%s::date, CURRENT_DATE - INTERVAL '90 days') AS date_from,
    COALESCE(%s::date, CURRENT_DATE) AS date_to
),
current_period AS (
  SELECT
    SUM(revenue) AS revenue,
    SUM(gross_margin) AS margin
  FROM v_order_finance f, period p
  WHERE f.order_date BETWEEN p.date_from AND p.date_to
),
prev_period AS (
  SELECT
    SUM(revenue) AS revenue
  FROM v_order_finance f, period p
  WHERE f.order_date BETWEEN (p.date_from - (p.date_to - p.date_from)) AND (p.date_from - INTERVAL '1 day')
),
 top_customer AS (
  SELECT
    c.customer_id,
    c.name,
    SUM(f.revenue) AS revenue,
    SUM(f.gross_margin) AS margin,
    COUNT(DISTINCT f.order_id) AS orders_count
  FROM v_order_finance f
  JOIN customers c ON c.customer_id = f.customer_id, period p
  WHERE f.order_date BETWEEN p.date_from AND p.date_to
  GROUP BY c.customer_id, c.name
  ORDER BY revenue DESC
  LIMIT 1
)
SELECT
  COALESCE(cp.revenue, 0) AS total_revenue,
  COALESCE(cp.margin, 0) AS total_margin,
  CASE WHEN COALESCE(cp.revenue,0) = 0 THEN NULL ELSE (cp.margin / cp.revenue) END AS margin_pct,
  CASE WHEN COALESCE(pp.revenue,0) = 0 THEN NULL ELSE ((cp.revenue - pp.revenue) / pp.revenue) END AS revenue_yoy_change_pct,
  tc.customer_id,
  tc.name,
  COALESCE(tc.revenue,0) AS tc_revenue,
  COALESCE(tc.margin,0) AS tc_margin,
  COALESCE(tc.orders_count,0) AS tc_orders_count
FROM current_period cp
LEFT JOIN prev_period pp ON TRUE
LEFT JOIN top_customer tc ON TRUE;
"""
