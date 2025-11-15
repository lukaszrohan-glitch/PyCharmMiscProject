@echo off
echo Setting up Cloudflare tunnel for Arkuszownia SMB...

REM Create directories
mkdir "%UserProfile%\.cloudflared" 2>nul

REM Login to Cloudflare if not already logged in
if not exist "%UserProfile%\.cloudflared\cert.pem" (
    echo Logging into Cloudflare...
    cloudflared tunnel login
)

REM Get or create tunnel
for /f %%i in ('cloudflared tunnel list ^| find "arkuszowniasmb"') do set TUNNEL_EXISTS=1
if not defined TUNNEL_EXISTS (
    echo Creating tunnel...
    cloudflared tunnel create arkuszowniasmb
) else (
    echo Tunnel already exists, getting token...
)

REM Get tunnel token
for /f "tokens=*" %%a in ('cloudflared tunnel token arkuszowniasmb') do set TUNNEL_TOKEN=%%a

REM Update .env file with token
echo Updating .env file...
(
    echo # Cloudflare credentials > .env.tmp
    echo CLOUDFLARE_TUNNEL_TOKEN=%TUNNEL_TOKEN% >> .env.tmp
    echo TUNNEL_ID=3e14f36a-7e9c-4a54-92ea-a58f1e856df5 >> .env.tmp
    echo. >> .env.tmp
    if exist .env type .env >> .env.tmp
)
move /y .env.tmp .env

REM Configure DNS
echo Configuring DNS...
cloudflared tunnel route dns arkuszowniasmb arkuszowniasmb.pl
cloudflared tunnel route dns arkuszowniasmb www.arkuszowniasmb.pl

REM Start tunnel
echo Starting tunnel...
docker-compose restart cloudflared

echo.
echo Setup complete! The site should be accessible at:
echo https://arkuszowniasmb.pl
echo.
echo If you see any errors, check:
echo 1. Cloudflare tunnel logs: docker-compose logs cloudflared
echo 2. Nginx logs: docker-compose logs nginx
echo 3. Frontend logs: docker-compose logs frontend
echo.
pause
