@echo off
echo.
echo 🔍 Checking your Admin API Key...
echo.
findstr /C:"ADMIN_KEY" docker-compose.yml
echo.
echo 💡 Look for the line: ADMIN_KEY=your-key-here
echo.
pausedo