@echo off
echo Starting Cloudflare tunnel...
cd /d %~dp0
cloudflared.exe tunnel --config cloudflared-config.yml run
pause

