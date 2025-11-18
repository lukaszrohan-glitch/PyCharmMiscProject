@echo off
echo Starting Synterra system...

REM Check if Docker is running
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running! Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Pull latest changes
echo Pulling latest changes...
git pull

REM Check if .env exists
if not exist .env (
    echo Creating .env file from example...
    copy .env.example .env
    echo Please update .env file with your configuration!
    notepad .env
)

REM Build and start containers
echo Starting services...
docker-compose down
docker-compose up -d --build

REM Wait for services to be healthy
echo Waiting for services to be ready...
timeout /t 10 /nobreak

REM Check services health
echo Checking service health...
docker-compose ps

REM Show URLs
echo.
echo Application is starting up!
echo.
echo Local access:
echo - Main application: http://localhost:8088
echo - API documentation: http://localhost:8080/docs
echo.
echo Network access:
echo - Main application: https://arkuszowniasmb.pl
echo - API endpoint: https://arkuszowniasmb.pl/api
echo.
echo To view logs, use: docker-compose logs -f
echo To stop the application, use: docker-compose down
echo.

REM Open browser
echo Opening application in browser...
start http://localhost:8088

echo Done! Press any key to exit...
pause
