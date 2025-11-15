
Write-Host "🚀 Populating test data..." -ForegroundColor Cyan

$sql = @"
-- Customers
INSERT INTO customers VALUES
('CUST-TECH', 'TechnoPlast Sp. z o.o.', '1234567890', 'Warszawa, ul. Marszałkowska 1', 'zamowienia@technoplast.pl'),
('CUST-AUTO', 'AutoParts Poland', '9876543210', 'Poznań, ul. Przemysłowa 15', 'biuro@autoparts.pl'),
('CUST-ELEC', 'ElectroMax', '5555555555', 'Katowice, ul. Energetyczna 8', 'kontakt@electromax.pl')
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products VALUES
('P-WIDGET-A', 'Widget Standard', 12.50, 35.00),
('P-WIDGET-B', 'Widget Premium', 18.00, 50.00),
('P-COMP-X', 'Komponent X-Series', 3.20, 9.50),
('P-COMP-Y', 'Komponent Y-Series', 4.50, 12.00)
ON CONFLICT DO NOTHING;

-- Orders with various statuses
INSERT INTO orders VALUES
('ORD-2024-001', '2024-01-15', 'CUST-TECH', 'Done', '2024-01-22'),
('ORD-2024-002', '2024-01-20', 'CUST-AUTO', 'Invoiced', '2024-01-27'),
('ORD-2024-003', CURRENT_DATE - 5, 'CUST-ELEC', 'InProd', CURRENT_DATE + 2),
('ORD-2024-004', CURRENT_DATE - 2, 'CUST-TECH', 'Planned', CURRENT_DATE + 7),
('ORD-2024-005', CURRENT_DATE, 'CUST-AUTO', 'New', CURRENT_DATE + 14)
ON CONFLICT DO NOTHING;

-- Order lines
INSERT INTO order_lines VALUES
('ORD-2024-001', 1, 'P-WIDGET-A', 200, 35.00, 0.10),
('ORD-2024-002', 1, 'P-WIDGET-B', 150, 50.00, 0.05),
('ORD-2024-003', 1, 'P-WIDGET-A', 300, 35.00, 0.15),
('ORD-2024-004', 1, 'P-COMP-X', 500, 9.50, 0.00),
('ORD-2024-005', 1, 'P-WIDGET-B', 100, 50.00, 0.08)
ON CONFLICT DO NOTHING;

-- Inventory
INSERT INTO inventory VALUES
('TXN-2024-001', CURRENT_DATE - 30, 'P-WIDGET-A', 5000, 'PO'),
('TXN-2024-002', CURRENT_DATE - 25, 'P-WIDGET-B', 3000, 'PO'),
('TXN-2024-003', CURRENT_DATE - 20, 'P-COMP-X', 10000, 'PO'),
('TXN-2024-004', CURRENT_DATE - 15, 'P-WIDGET-A', -200, 'WO'),
('TXN-2024-005', CURRENT_DATE - 10, 'P-WIDGET-B', -150, 'WO')
ON CONFLICT DO NOTHING;
"@

# Save to temp file
$sql | Out-File -FilePath "temp-data.sql" -Encoding UTF8

# Execute
docker exec -i smb_db psql -U smbuser -d smbdb -f /dev/stdin < temp-data.sql

# Cleanup
Remove-Item "temp-data.sql"

Write-Host "✅ Test data populated!" -ForegroundColor Green
Write-Host "📊 Added:" -ForegroundColor Yellow
Write-Host "   - 3 customers" -ForegroundColor Gray
Write-Host "   - 4 products" -ForegroundColor Gray
Write-Host "   - 5 orders (various statuses)" -ForegroundColor Gray
Write-Host "   - 5 order lines" -ForegroundColor Gray
Write-Host "   - 5 inventory transactions" -ForegroundColor Gray
