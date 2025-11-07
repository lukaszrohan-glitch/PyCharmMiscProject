@echo off
rem Fixing Docker build issue with node_modules and rebuilding frontend service

echo.
echo [1/4] Ensure Docker is available...
where docker >nul 2>&1
if errorlevel 1 (
    echo Docker not found in PATH. Please install Docker Desktop and ensure "docker" is on PATH.
    goto :end
) else (
    echo Docker found.
)

echo.
echo [2/4] Removing local node_modules if present (helps with cached native binaries)...
if exist "%~dp0..\frontend\node_modules" (
    echo Removing %~dp0..\frontend\node_modules
    rd /s /q "%~dp0..\frontend\node_modules"
    if errorlevel 1 (
        echo Failed to remove node_modules. You may need to close node processes or run this as Administrator.
    ) else (
        echo Done.
    )
) else (
    echo No node_modules found.
)

echo.
echo [3/4] Rebuilding frontend image (no-cache)...
pushd "%~dp0..\frontend" >nul 2>&1
if errorlevel 1 (
    echo Failed to change directory to frontend. Check path.
    popd >nul 2>&1
    goto :end
)
docker compose build --no-cache frontend
set RC=%ERRORLEVEL%
popd >nul 2>&1
if %RC% neq 0 (
    echo Docker build failed with code %RC%.
    goto :end
)

echo.
echo [4/4] Starting frontend service...
docker compose up -d frontend
if errorlevel 1 (
    echo Failed to start frontend with docker compose.
    goto :end
) else (
    echo Frontend service started.
)

echo.
echo Check status with: docker compose ps
echo View logs with: docker compose logs -f frontend

:done
echo.
echo Done!
goto :eof

:end
echo.
echo Script finished with errors. Inspect the output above.
pause
goto :eof
