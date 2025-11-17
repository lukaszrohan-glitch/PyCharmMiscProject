@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   🚀 STARTING ARKUSZOWNIA SMB                             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running!
    echo.
    echo 🐳 Please start Docker Desktop first, then run this script again.
    echo.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.
echo 🐳 Starting all services with Docker Compose...
echo.

docker-compose up -d

if errorlevel 1 (
    echo.
    echo ❌ Failed to start services!
    echo.
    echo 💡 Try running: docker-compose down
    echo    Then run this script again.
    echo.
    pause
    exit /b 1
)

echo.
echo ⏳ Waiting for services to initialize (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo ✅ APPLICATION IS READY!
echo.
echo 📋 Access points:
echo.
echo    🌐 Frontend:  http://localhost:5173
echo    🔧 Backend:   http://localhost:8000
echo    📚 API Docs:  http://localhost:8000/docs
echo.
echo 🔑 IMPORTANT - First Time Setup:
echo.
echo    1. Open: http://localhost:8000/docs
echo    2. Find: POST /admin/api-keys
echo    3. Click "Try it out"
echo    4. Use Admin Key: test-admin-key
echo    5. Create API key with label: "my-key"
echo    6. Copy the generated API key
echo    7. Go to frontend and enter it in settings
echo.
echo 🛑 To stop: Run STOP-ALL.cmd or press Ctrl+C
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Show admin key
echo 🔑 Admin Key Configuration:
findstr /C:"ADMIN_KEY" docker-compose.yml
echo.

REM Open browser automatically
start http://localhost:5173

pause