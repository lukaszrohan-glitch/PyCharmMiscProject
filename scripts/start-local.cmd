@echo off
REM Run the SMB Tool locally without Docker
echo ========================================
echo Starting SMB Tool (Local Development)
echo ========================================
echo.
echo This will start:
echo   1. Python backend (SQLite) on port 8000
echo   2. Vite frontend dev server on port 5173
echo.
echo Press Ctrl+C in each window to stop
echo ========================================
echo.

REM Add Node.js to PATH
set "PATH=C:\Program Files\nodejs;%PATH%"

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found even after adding to PATH!
    echo Please install Node.js LTS from https://nodejs.org
    echo Or check if Node.js is installed in a different location.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo npm version:
npm --version
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python 3.9+ and add to PATH
    pause
    exit /b 1
)

echo [1/4] Activating Python virtual environment...
if not exist .venv (
    echo Creating virtual environment...
    python -m venv .venv
)
call .venv\Scripts\activate.bat

echo.
echo [2/4] Installing Python dependencies...
python -m pip install --upgrade pip >nul
pip install -r requirements-dev.txt

echo.
echo [3/4] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo [4/4] Starting services...
echo.
echo Starting backend in new window...
start "SMB Tool Backend" cmd /k ".venv\Scripts\activate.bat && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo Starting frontend in new window...
cd frontend
start "SMB Tool Frontend" cmd /k "npm run dev -- --host 0.0.0.0"
cd ..

echo.
echo ========================================
echo Services Started!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo.
echo Default API Key: changeme123
echo Admin Key: test-admin-key
echo.
echo Two new windows opened with the servers.
echo Close those windows to stop the servers.
echo.
pause

