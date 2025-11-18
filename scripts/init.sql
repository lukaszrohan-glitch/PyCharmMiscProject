-- Minimal init SQL to create tables and seed data for development
-- Run by docker-entrypoint-initdb.d on Postgres container startup

CREATE TABLE IF NOT EXISTS customers (
  customer_id text PRIMARY KEY,
  name text NOT NULL,
  nip text,
  address text,
  email text,
  contact_person text,
  payment_terms_days integer NOT NULL DEFAULT 14,
  active integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS products (
  product_id text PRIMARY KEY,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'pcs',
  std_cost numeric(18,4) NOT NULL DEFAULT 0,
  price numeric(18,4) NOT NULL DEFAULT 0,
  vat_rate numeric(5,2) NOT NULL DEFAULT 23,
  make_or_buy text NOT NULL DEFAULT 'Make'
);

CREATE TABLE IF NOT EXISTS bom (
  parent_product_id text REFERENCES products(product_id) ON DELETE CASCADE,
  component_id text REFERENCES products(product_id) ON DELETE RESTRICT,
  qty_per numeric(18,6) NOT NULL,
  scrap_pct numeric(6,4) NOT NULL DEFAULT 0,
  PRIMARY KEY (parent_product_id, component_id)
);

CREATE TABLE IF NOT EXISTS routings (
  product_id text REFERENCES products(product_id) ON DELETE CASCADE,
  operation_no integer NOT NULL,
  work_center text NOT NULL,
  std_setup_min numeric(18,2) NOT NULL DEFAULT 0,
  std_run_min_per_unit numeric(18,4) NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, operation_no)
);

CREATE TABLE IF NOT EXISTS orders (
  order_id text PRIMARY KEY,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  customer_id text NOT NULL REFERENCES customers(customer_id),
  status text NOT NULL DEFAULT 'Planned',
  due_date date
);

CREATE TABLE IF NOT EXISTS order_lines (
  order_id text REFERENCES orders(order_id) ON DELETE CASCADE,
  line_no integer NOT NULL,
  product_id text NOT NULL REFERENCES products(product_id),
  qty numeric(18,4) NOT NULL,
  unit_price numeric(18,4) NOT NULL,
  discount_pct numeric(6,4) NOT NULL DEFAULT 0,
  graphic_id text,
  PRIMARY KEY (order_id, line_no)
);

CREATE TABLE IF NOT EXISTS inventory (
  txn_id text PRIMARY KEY,
  txn_date date NOT NULL DEFAULT CURRENT_DATE,
  product_id text NOT NULL REFERENCES products(product_id),
  qty_change numeric(18,4) NOT NULL,
  reason text NOT NULL,
  lot text,
  location text
);

CREATE TABLE IF NOT EXISTS employees (
  emp_id text PRIMARY KEY,
  name text NOT NULL,
  role text,
  hourly_rate numeric(18,4) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS timesheets (
  ts_id bigserial PRIMARY KEY,
  emp_id text NOT NULL REFERENCES employees(emp_id),
  ts_date date NOT NULL DEFAULT CURRENT_DATE,
  order_id text REFERENCES orders(order_id) ON DELETE SET NULL,
  operation_no integer,
  hours numeric(10,2) NOT NULL,
  notes text,
  approved boolean NOT NULL DEFAULT FALSE,
  approved_by text,
  approved_at timestamptz
);

-- Approvals columns for existing deployments
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT FALSE;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS approved_by text;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- API keys table (for admin-managed API keys)
CREATE TABLE IF NOT EXISTS api_keys (
  id bigserial PRIMARY KEY,
  key_text text,
  key_hash text,
  salt text,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  active integer NOT NULL DEFAULT 1,
  last_used timestamptz
);

-- audit log for api key events
CREATE TABLE IF NOT EXISTS api_key_audit (
  audit_id bigserial PRIMARY KEY,
  api_key_id bigint REFERENCES api_keys(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_by text,
  event_time timestamptz NOT NULL DEFAULT now(),
  details jsonb
);

-- General admin audit table
CREATE TABLE IF NOT EXISTS admin_audit (
  audit_id bigserial PRIMARY KEY,
  event_type text NOT NULL,
  event_by text,
  event_time timestamptz NOT NULL DEFAULT now(),
  details jsonb
);

-- Users tables (created by user_mgmt.py on app startup, but define here for init)
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  company_id TEXT,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  subscription_plan TEXT DEFAULT 'free',
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login timestamptz,
  password_changed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  plan_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  max_orders INTEGER,
  max_users INTEGER,
  features TEXT
);

-- minimal seed
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person text;
INSERT INTO customers(customer_id, name, nip, address, email, contact_person) VALUES ('CUST-ALFA', 'Alfa Sp. z o.o.', '1234567890', 'Warszawa', 'biuro@alfa.pl', 'Jan Kowalski') ON CONFLICT DO NOTHING;
INSERT INTO products(product_id, name, std_cost, price) VALUES ('P-100', 'Gadzet A', 10, 30), ('P-101', 'Komponent X', 2, 5) ON CONFLICT DO NOTHING;
INSERT INTO bom(parent_product_id, component_id, qty_per, scrap_pct) VALUES ('P-100','P-101',2,0.05) ON CONFLICT DO NOTHING;
INSERT INTO routings(product_id, operation_no, work_center, std_setup_min, std_run_min_per_unit) VALUES ('P-100', 10, 'Monta\u017c', 15, 2.5) ON CONFLICT DO NOTHING;
INSERT INTO employees(emp_id, name, role, hourly_rate) VALUES ('E-01', 'Jan Kowalski', 'Operator', 45.00) ON CONFLICT DO NOTHING;
INSERT INTO orders(order_id, order_date, customer_id, status, due_date) VALUES ('ORD-0001', CURRENT_DATE, 'CUST-ALFA', 'Planned', CURRENT_DATE + 7) ON CONFLICT DO NOTHING;
INSERT INTO order_lines(order_id, line_no, product_id, qty, unit_price, discount_pct) VALUES ('ORD-0001', 1, 'P-100', 50, 30, 0.05) ON CONFLICT DO NOTHING;
INSERT INTO inventory(txn_id, txn_date, product_id, qty_change, reason) VALUES ('TXN-PO-1', CURRENT_DATE, 'P-101', 500, 'PO') ON CONFLICT DO NOTHING;
INSERT INTO inventory(txn_id, txn_date, product_id, qty_change, reason) VALUES ('TXN-WO-ISS-1', CURRENT_DATE, 'P-101', -100, 'WO') ON CONFLICT DO NOTHING;
INSERT INTO inventory(txn_id, txn_date, product_id, qty_change, reason) VALUES ('TXN-WO-RCPT-1', CURRENT_DATE, 'P-100', 50, 'WO') ON CONFLICT DO NOTHING;
INSERT INTO timesheets(emp_id, ts_date, order_id, operation_no, hours, notes) VALUES ('E-01', CURRENT_DATE, 'ORD-0001', 10, 6.5, 'Seria 50 szt.') ON CONFLICT DO NOTHING;
INSERT INTO api_keys (key_text, label, created_at, active) VALUES ('changeme123', 'default-dev-key', now(), 1) ON CONFLICT DO NOTHING;

INSERT INTO subscription_plans(plan_id, name, max_orders, max_users, features) VALUES 
  ('free', 'Free Plan', 10, 1, 'Basic features'),
  ('pro', 'Pro Plan', 100, 5, 'Advanced features'),
  ('enterprise', 'Enterprise Plan', NULL, NULL, 'All features')
ON CONFLICT DO NOTHING;



-- --------------------------------------------------------------------
-- Views required by API endpoints (finance, shortages, planned time)
-- --------------------------------------------------------------------
CREATE OR REPLACE VIEW v_order_finance AS
SELECT o.order_id,
       COALESCE(SUM(ol.qty*ol.unit_price*(1 - ol.discount_pct)),0) AS revenue,
       COALESCE(SUM(ol.qty*p.std_cost),0) AS material_cost,
       COALESCE((SELECT SUM(t.hours * e.hourly_rate) FROM timesheets t JOIN employees e ON t.emp_id = e.emp_id WHERE t.order_id = o.order_id),0) AS labor_cost,
       COALESCE(SUM(ol.qty*ol.unit_price*(1 - ol.discount_pct)),0) - COALESCE(SUM(ol.qty*p.std_cost),0) - COALESCE((SELECT SUM(t.hours * e.hourly_rate) FROM timesheets t JOIN employees e ON t.emp_id = e.emp_id WHERE t.order_id = o.order_id),0) AS gross_margin
FROM orders o
LEFT JOIN order_lines ol ON o.order_id = ol.order_id
LEFT JOIN products p ON ol.product_id = p.product_id
GROUP BY o.order_id;

CREATE OR REPLACE VIEW v_shortages AS
SELECT
  ol.order_id,
  ol.product_id AS component_id,
  ol.qty AS required_qty,
  COALESCE((SELECT SUM(i.qty_change) FROM inventory i WHERE i.product_id = ol.product_id),0) AS qty_on_hand,
  CASE WHEN COALESCE((SELECT SUM(i.qty_change) FROM inventory i WHERE i.product_id = ol.product_id),0) < ol.qty
       THEN ol.qty - COALESCE((SELECT SUM(i.qty_change) FROM inventory i WHERE i.product_id = ol.product_id),0)
       ELSE 0 END AS shortage_qty
FROM order_lines ol;

CREATE OR REPLACE VIEW v_planned_time AS
SELECT o.order_id,
       COALESCE(SUM(ol.qty) * 0.1, 0) AS planned_hours
FROM orders o
LEFT JOIN order_lines ol ON o.order_id = ol.order_id
GROUP BY o.order_id;

-- -------------------------------------------------------------
-- Helpful indexes (idempotent) to improve query performance
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_order_lines_product ON order_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_emp ON timesheets(emp_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_order ON timesheets(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_date ON inventory(txn_date);
