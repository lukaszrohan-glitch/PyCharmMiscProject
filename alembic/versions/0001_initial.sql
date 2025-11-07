-- initial schema migration (generated from scripts/init.sql)

-- Note: Run this with alembic or psql for first-time setup.

CREATE TABLE IF NOT EXISTS customers (
  customer_id text PRIMARY KEY,
  name text NOT NULL,
  nip text,
  address text,
  email text,
  payment_terms_days integer NOT NULL DEFAULT 14,
  active boolean NOT NULL DEFAULT true
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
  notes text
);

CREATE TABLE IF NOT EXISTS api_keys (
  key_text text PRIMARY KEY,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

-- seed (optional)
INSERT INTO api_keys (key_text, label, created_at, active) VALUES ('changeme123', 'default-dev-key', now(), true) ON CONFLICT DO NOTHING;

