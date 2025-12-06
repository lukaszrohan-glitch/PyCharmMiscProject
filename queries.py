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

# Indexes for performance - Comprehensive coverage for all frequent queries
SQL_CREATE_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_due_date ON orders(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_composite ON orders(status, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_order_lines_order ON order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_product ON order_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_composite ON order_lines(order_id, line_no);
CREATE INDEX IF NOT EXISTS idx_timesheets_emp ON timesheets(emp_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_order ON timesheets(order_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_date ON timesheets(ts_date DESC);
CREATE INDEX IF NOT EXISTS idx_timesheets_approved ON timesheets(approved) WHERE approved = FALSE;
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_date ON inventory(txn_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_reason ON inventory(reason);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_type ON products(make_or_buy);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active) WHERE active = 1;
"""

# ANALYTICS QUERIES
SQL_REVENUE_BY_MONTH = """
SELECT
  DATE_TRUNC('month', o.order_date)::date AS month,
  SUM(f.revenue) AS revenue,
  SUM(f.gross_margin) AS margin
FROM v_order_finance f
JOIN orders o ON o.order_id = f.order_id
GROUP BY DATE_TRUNC('month', o.order_date)
ORDER BY DATE_TRUNC('month', o.order_date);
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
JOIN orders o ON o.order_id = f.order_id
WHERE (%s IS NULL OR o.order_date >= %s)
  AND (%s IS NULL OR o.order_date <= %s)
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
JOIN orders o ON o.order_id = f.order_id
WHERE (%s IS NULL OR o.order_date >= %s)
  AND (%s IS NULL OR o.order_date <= %s)
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
  FROM v_order_finance f
  JOIN orders o ON o.order_id = f.order_id,
       period p
  WHERE o.order_date BETWEEN p.date_from AND p.date_to
),
prev_period AS (
  SELECT
    SUM(revenue) AS revenue
  FROM v_order_finance f
  JOIN orders o ON o.order_id = f.order_id,
       period p
  WHERE o.order_date BETWEEN (p.date_from - (p.date_to - p.date_from)) AND (p.date_from - INTERVAL '1 day')
),
 top_customer AS (
  SELECT
    c.customer_id,
    c.name,
    SUM(f.revenue) AS revenue,
    SUM(f.gross_margin) AS margin,
    COUNT(DISTINCT f.order_id) AS orders_count
  FROM v_order_finance f
  JOIN customers c ON c.customer_id = f.customer_id
  JOIN orders o ON o.order_id = f.order_id,
       period p
  WHERE o.order_date BETWEEN p.date_from AND p.date_to
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

SQL_FIND_ORDER = "SELECT 1 FROM orders WHERE order_id = %s"
SQL_FIND_CUSTOMER = "SELECT 1 FROM customers WHERE customer_id = %s"
SQL_NEXT_ORDER_ID = """\
WITH max_suffix AS (
    SELECT COALESCE(MAX(TO_NUMBER(REGEXP_REPLACE(order_id, '\\D', '', 'g'), '999999999')), 0) AS max_seq
    FROM orders
    WHERE order_id ~ '^[A-Z0-9-]+$'
)
SELECT LPAD((max_seq + 1)::text, 4, '0') AS next_suffix FROM max_suffix;
"""
SQL_NEXT_CUSTOMER_ID = """\
WITH max_suffix AS (
    SELECT COALESCE(MAX(TO_NUMBER(REGEXP_REPLACE(customer_id, '\\D', '', 'g'), '999999999')), 0) AS max_seq
    FROM customers
    WHERE customer_id ~ '^[A-Z0-9-]+$'
)
SELECT 'CUST-' || LPAD((max_seq + 1)::text, 4, '0') AS next_id FROM max_suffix;
"""

SQL_CREATE_DEMAND_SCENARIOS = """
CREATE TABLE IF NOT EXISTS demand_scenarios (
    scenario_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    multiplier REAL NOT NULL,
    backlog_weeks REAL NOT NULL,
    created_by TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""
