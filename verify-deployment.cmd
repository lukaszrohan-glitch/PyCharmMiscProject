@echo off
REM Verification script for Arkuszownia SMB deployment
REM This script verifies that all services are running and healthy

echo.
echo ========================================
echo Arkuszownia SMB - Deployment Verification
echo ========================================
echo.

echo [1/5] Checking Docker services...
docker ps --format "table {{.Names}}\t{{.Status}}"

echo.
echo [2/5] Checking API health...
curl -s http://localhost:8088/api/healthz
echo.

echo.
echo [3/5] Checking API endpoints...
echo Getting products...
curl -s http://localhost:8088/api/products -H "X-API-Key: dev-key-change-in-production" | findstr "product_id"

echo.
echo Getting orders...
curl -s http://localhost:8088/api/orders -H "X-API-Key: dev-key-change-in-production" | findstr "order_id"

echo.
echo [4/5] Checking frontend...
curl -s -I http://localhost:8088 | findstr "200 OK"

echo.
echo [5/5] Checking database...
docker-compose exec -T db psql -U smb_user -d smbtool -c "SELECT version();" 2>nul | findstr "PostgreSQL"

echo.
echo ========================================
echo Verification Complete!
echo ========================================
echo.
echo Services Status:
docker-compose ps

echo.
echo To access the application:
echo   Frontend: http://localhost:8088
echo   API: http://localhost:8088/api
echo.
echo Default credentials:
echo   Email: admin@arkuszowniasmb.pl
echo   Password: SMB#Admin2025!
echo.
echo View logs with:
echo   docker-compose logs -f backend
echo   docker-compose logs -f nginx
echo.
pause
