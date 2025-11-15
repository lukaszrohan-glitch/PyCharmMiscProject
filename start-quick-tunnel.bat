@echo off
cd /d C:\Users\lukas\PyCharmMiscProject
cloudflared.exe tunnel --url http://localhost:8088
pause
