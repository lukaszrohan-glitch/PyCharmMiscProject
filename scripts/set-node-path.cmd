@echo off
REM Ensure Node.js default install path is in PATH for this session
set "PATH=C:\Program Files\nodejs;%PATH%"
where node
where npm
node -v
npm -v

