# Collect logs helper for development (PowerShell)
# Run from project root: .\scripts\collect-logs.ps1

$logsDir = Join-Path (Get-Location) "logs"
if (!(Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }

Write-Host "Collecting environment info..."
python --version > "$logsDir\env_python.txt" 2>&1
node --version > "$logsDir\env_node.txt" 2>&1
npm --version > "$logsDir\env_npm.txt" 2>&1

Write-Host "Pip freeze..."
if (Test-Path ".venv\Scripts\python.exe") {
    .\.venv\Scripts\python.exe -m pip freeze > "$logsDir\pip_freeze.txt" 2>&1
}

Write-Host "Netstat (common ports)..."
netstat -ano | findstr ":8000" > "$logsDir\netstat_8000.txt" 2>&1
netstat -ano | findstr ":5173" > "$logsDir\netstat_5173.txt" 2>&1

Write-Host "Capture docker-compose logs (if present)..."
if (Test-Path "docker-compose.yml") {
    docker-compose up -d > "$logsDir\docker_compose_up.txt" 2>&1
    docker-compose logs --no-color > "$logsDir\docker_compose_logs.txt" 2>&1
}

Write-Host "Done. Please check the 'logs' folder for collected artifacts."
