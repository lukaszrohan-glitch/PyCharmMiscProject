@echo off
call "%~dp0set-node-path.cmd"
cd /d "%~dp0..\frontend"
npm audit fix || echo Audit fix completed with non-zero issues.

