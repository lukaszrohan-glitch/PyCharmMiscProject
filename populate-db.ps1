
param(
    [switch]$Reset,
    [switch]$Minimal,
    [switch]$Full
)

Write-Host "🗄️  Database Population Tool" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if containers are running
$dbRunning = docker ps --filter "name=smb_db" --format "{{.Names}}"
if (-not $dbRunning) {
    Write-Host "❌ Database container not running!" -ForegroundColor Red
    Write-Host "   Run: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

if ($Reset) {
    Write-Host "⚠️  Resetting database..." -ForegroundColor Yellow
    docker exec smb_db psql -U smbuser -d smbdb -c "
        TRUNCATE TABLE timesheets, inventory, order_lines, orders,
                       routings, bom, products, customers, employees
        CASCADE;
    "
    Write-Host "✅ Database reset complete`n" -ForegroundColor Green
}

$sqlFile = "temp-populate.sql"

if ($Minimal) {
    Write-Host "📦 Adding minimal test data..." -ForegroundColor Yellow

    $sql = @"
-- Minimal dataset
INSERT INTO customers VALUES ('CUST-001', 'Test Customer', '1234567890', 'Warsaw', 'test@example.com') ON CONFLICT DO NOTHING;
INSERT INTO products VALUES ('PROD-001', 'Test Product', 10.00, 25.00) ON CONFLICT DO NOTHING;
INSERT INTO orders VALUES ('ORD-001', CURRENT_DATE, 'CUST-001', 'New', CURRENT_DATE + 7) ON CONFLICT DO NOTHING;
INSERT INTO order_lines VALUES ('ORD-001', 1, 'PROD-001', 10, 25.00, 0.00) ON CONFLICT DO NOTHING;
"@
} elseif ($Full) {
    Write-Host "📦 Adding comprehensive test data..." -ForegroundColor Yellow

    $sql = @"
-- Comprehensive dataset
INSERT INTO customers VALUES
('CUST-TECH', 'TechnoPlast Sp. z o.o.', '1234567890', 'Warszawa, ul. Marszałkowska 1', 'zamowienia@technoplast.pl'),
('CUST-AUTO', 'AutoParts Poland', '9876543210', 'Poznań, ul. Przemysłowa 15', 'biuro@autoparts.pl'),
('CUST-ELEC', 'ElectroMax', '5555555555', 'Katowice, ul. Energetyczna 8', 'kontakt@electromax.pl'),
('CUST-MECH', 'MechPro Industries', '7777777777', 'Wrocław, ul. Fabryczna 22', 'info@mechpro.pl')
ON CONFLICT DO NOTHING;

INSERT INTO products VALUES
('P-WIDGET-A', 'Widget Standard', 12.50, 35.00),
('P-WIDGET-B', 'Widget Premium', 18.00, 50.00),
('P-WIDGET-C', 'Widget Deluxe', 25.00, 70.00),
('P-COMP-X', 'Komponent X-Series', 3.20, 9.50),
('P-COMP-Y', 'Komponent Y-Series', 4.50, 12.00),
('P-COMP-Z', 'Komponent Z-Series', 6.00, 15.00)
ON CONFLICT DO NOTHING;

INSERT INTO bom VALUES
('P-WIDGET-A', 'P-COMP-X', 2, 0.05),
('P-WIDGET-B', 'P-COMP-Y', 3, 0.03),
('P-WIDGET-C', 'P-COMP-Z', 4, 0.02)
ON CONFLICT DO NOTHING;

INSERT INTO routings VALUES
('P-WIDGET-A', 10, 'Assembly', 15, 2.5),
('P-WIDGET-B', 10, 'Assembly', 20, 3.0),
('P-WIDGET-C', 10, 'Assembly', 25, 4.0)
ON CONFLICT DO NOTHING;

INSERT INTO employees VALUES
('EMP-001', 'Jan Kowalski', 'Operator', 45.00),
('EMP-002', 'Anna Nowak', 'Technician', 55.00),
('EMP-003', 'Piotr Wiśniewski', 'Supervisor', 65.00)
ON CONFLICT DO NOTHING;

INSERT INTO orders VALUES
('ORD-2024-001', '2024-01-15', 'CUST-TECH', 'Done', '2024-01-22'),
('ORD-2024-002', '2024-01-20', 'CUST-AUTO', 'Invoiced', '2024-01-27'),
('ORD-2024-003', CURRENT_DATE - 5, 'CUST-ELEC', 'InProd', CURRENT_DATE + 2),
('ORD-2024-004', CURRENT_DATE - 2, 'CUST-MECH', 'Planned', CURRENT_DATE + 7),
('ORD-2024-005', CURRENT_DATE, 'CUST-TECH', 'New', CURRENT_DATE + 14),
('ORD-2024-006', CURRENT_DATE + 1, 'CUST-AUTO', 'New', CURRENT_DATE + 21)
ON CONFLICT DO NOTHING;

INSERT INTO order_lines VALUES
('ORD-2024-001', 1, 'P-WIDGET-A', 200, 35.00, 0.10),
('ORD-2024-002', 1, 'P-WIDGET-B', 150, 50.00, 0.05),
('ORD-2024-002', 2, 'P-WIDGET-A', 100, 35.00, 0.05),
('ORD-2024-003', 1, 'P-WIDGET-C', 75, 70.00, 0.15),
('ORD-2024-004', 1, 'P-WIDGET-A', 300, 35.00, 0.00),
('ORD-2024-005', 1, 'P-WIDGET-B', 100, 50.00, 0.08),
('ORD-2024-006', 1, 'P-WIDGET-C', 50, 70.00, 0.10)
ON CONFLICT DO NOTHING;

INSERT INTO inventory VALUES
('INV-2024-001', CURRENT_DATE - 30, 'P-WIDGET-A', 5000, 'PO'),
('INV-2024-002', CURRENT_DATE - 25, 'P-WIDGET-B', 3000, 'PO'),
('INV-2024-003', CURRENT_DATE - 20, 'P-WIDGET-C', 2000, 'PO'),
('INV-2024-004', CURRENT_DATE - 20, 'P-COMP-X', 10000, 'PO'),
('INV-2024-005', CURRENT_DATE - 20, 'P-COMP-Y', 8000, 'PO'),
('INV-2024-006', CURRENT_DATE - 20, 'P-COMP-Z', 6000, 'PO'),
('INV-2024-007', CURRENT_DATE - 15, 'P-WIDGET-A', -200, 'WO'),
('INV-2024-008', CURRENT_DATE - 10, 'P-WIDGET-B', -150, 'WO'),
('INV-2024-009', CURRENT_DATE - 5, 'P-COMP-X', -400, 'WO'),
('INV-2024-010', CURRENT_DATE - 5, 'P-COMP-Y', -450, 'WO')
ON CONFLICT DO NOTHING;

INSERT INTO timesheets VALUES
('EMP-001', CURRENT_DATE - 10, 'ORD-2024-001', 10, 8.0, 'Assembly batch 1'),
('EMP-002', CURRENT_DATE - 9, 'ORD-2024-002', 15, 7.5, 'Quality check'),
('EMP-003', CURRENT_DATE - 8, 'ORD-2024-003', 20, 8.5, 'Production line'),
('EMP-001', CURRENT_DATE - 7, 'ORD-2024-004', 12, 8.0, 'Assembly batch 2'),
('EMP-002', CURRENT_DATE - 6, 'ORD-2024-005', 18, 8.0, 'Final assembly'),
('EMP-003', CURRENT_DATE - 5, 'ORD-2024-006', 25, 9.0, 'Batch production')
ON CONFLICT DO NOTHING;
"@
} else {
    Write-Host "⚠️  No data type specified. Use -Minimal or -Full." -ForegroundColor Yellow
    exit 1
}

# Write SQL to file
$sql | Out-File -FilePath $sqlFile -Encoding UTF8

# Execute SQL file
Write-Host "🚀 Executing SQL script..." -ForegroundColor Yellow
docker exec smb_db psql -U smbuser -d smbdb -f "/app/$sqlFile"
Write-Host "✅ Data population complete!" -ForegroundColor Green

# Cleanup
Remove-Item $sqlFile -Force
Write-Host "🧹 Cleaned up temporary file" -ForegroundColor Gray
