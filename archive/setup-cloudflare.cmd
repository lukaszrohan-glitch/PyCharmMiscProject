@echo off
echo Setting up Cloudflare Tunnel for arkuszowniasmb.pl

REM Install cloudflared if not present
if not exist "%ProgramFiles%\cloudflared\cloudflared.exe" (
    echo Installing cloudflared...
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe -o cloudflared.exe
)

REM Login to Cloudflare
echo Please log in to Cloudflare in your browser...
cloudflared tunnel login

REM Create tunnel
echo Creating tunnel...
cloudflared tunnel create arkuszowniasmb

REM Get tunnel ID
for /f "tokens=*" %%a in ('cloudflared tunnel list ^| findstr "arkuszowniasmb"') do (
    set TUNNEL_ID=%%a
)

REM Update .env file with tunnel ID
echo TUNNEL_ID=%TUNNEL_ID% >> .env

REM Create DNS record
echo Creating DNS records...
cloudflared tunnel route dns %TUNNEL_ID% arkuszowniasmb.pl
cloudflared tunnel route dns %TUNNEL_ID% www.arkuszowniasmb.pl

echo Tunnel setup complete! Please update your DNS settings in Cloudflare to point to the tunnel.
echo Next steps:
echo 1. Go to Cloudflare dashboard
echo 2. Select arkuszowniasmb.pl domain
echo 3. Go to DNS settings
echo 4. Verify CNAME records are created
echo 5. Enable Cloudflare proxy (orange cloud)

pause
