-- Seed data for development/production
-- This migration populates the tables with sample data if they don't exist

INSERT INTO customers(customer_id, name, nip, address, email, active) 
VALUES ('CUST-001', 'Alfa Sp. z o.o.', '1234567890', 'Warszawa', 'biuro@alfa.pl', 1),
       ('CUST-002', 'Beta Ltd.', '0987654321', 'Kraków', 'contact@beta.pl', 1)
ON CONFLICT (customer_id) DO NOTHING;

INSERT INTO products(product_id, name, unit, std_cost, price, vat_rate, make_or_buy)
VALUES ('P-100', 'Gadzet A', 'pcs', 10, 30, 23, 'Make'),
       ('P-101', 'Komponent X', 'pcs', 2, 5, 23, 'Make'),
       ('P-102', 'Montaż', 'svc', 0, 50, 23, 'Make')
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO bom(parent_product_id, component_id, qty_per, scrap_pct)
VALUES ('P-100', 'P-101', 2, 0.05)
ON CONFLICT (parent_product_id, component_id) DO NOTHING;

INSERT INTO routings(product_id, operation_no, work_center, std_setup_min, std_run_min_per_unit)
VALUES ('P-100', 10, 'Montaż', 15, 2.5),
       ('P-101', 10, 'Magazyn', 5, 0.5)
ON CONFLICT (product_id, operation_no) DO NOTHING;

INSERT INTO employees(emp_id, name, role, hourly_rate)
VALUES ('E-01', 'Jan Kowalski', 'Operator', 45.00),
       ('E-02', 'Maria Nowak', 'Supervisor', 55.00),
       ('E-03', 'Piotr Lewandowski', 'Technician', 50.00)
ON CONFLICT (emp_id) DO NOTHING;

INSERT INTO orders(order_id, order_date, customer_id, status, due_date)
VALUES ('ORD-0001', CURRENT_DATE, 'CUST-001', 'Planned', CURRENT_DATE + INTERVAL '7 days'),
       ('ORD-0002', CURRENT_DATE - INTERVAL '2 days', 'CUST-002', 'In Progress', CURRENT_DATE + INTERVAL '5 days'),
       ('ORD-0003', CURRENT_DATE - INTERVAL '5 days', 'CUST-001', 'Completed', CURRENT_DATE - INTERVAL '1 days')
ON CONFLICT (order_id) DO NOTHING;

INSERT INTO order_lines(order_id, line_no, product_id, qty, unit_price, discount_pct)
VALUES ('ORD-0001', 1, 'P-100', 50, 30, 0.05),
       ('ORD-0001', 2, 'P-101', 100, 5, 0),
       ('ORD-0002', 1, 'P-100', 25, 30, 0.1),
       ('ORD-0003', 1, 'P-101', 200, 5, 0)
ON CONFLICT (order_id, line_no) DO NOTHING;

INSERT INTO inventory(txn_id, txn_date, product_id, qty_change, reason, lot, location)
VALUES ('TXN-PO-1', CURRENT_DATE, 'P-101', 500, 'PO', 'LOT-001', 'A1'),
       ('TXN-WO-ISS-1', CURRENT_DATE, 'P-101', -100, 'WO', NULL, NULL),
       ('TXN-WO-RCPT-1', CURRENT_DATE, 'P-100', 50, 'WO', 'LOT-002', 'B2'),
       ('TXN-ADJ-1', CURRENT_DATE, 'P-100', -5, 'Adjustment', NULL, 'B2')
ON CONFLICT (txn_id) DO NOTHING;

INSERT INTO timesheets(emp_id, ts_date, order_id, operation_no, hours, notes)
VALUES ('E-01', CURRENT_DATE, 'ORD-0001', 10, 6.5, 'Seria 50 szt.'),
       ('E-02', CURRENT_DATE, 'ORD-0002', 10, 4.0, 'Inspekcja'),
       ('E-01', CURRENT_DATE - INTERVAL '1 days', 'ORD-0003', 10, 8.0, 'Montaż kompletny'),
       ('E-03', CURRENT_DATE, 'ORD-0001', 20, 3.5, 'Testy QC')
ON CONFLICT DO NOTHING;
