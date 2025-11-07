@echo off
call "%~dp0set-node-path.cmd"
cd /d "%~dp0..\frontend"
npm install
npm run build:lib

