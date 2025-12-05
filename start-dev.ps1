# Skrypt do uruchamiania aplikacji w trybie deweloperskim
# Uruchamia backend i frontend jednocześnie

Write-Host "🚀 Uruchamianie aplikacji w trybie deweloperskim..." -ForegroundColor Green

# Uruchom backend w osobnym oknie PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

# Odczekaj 3 sekundy, aby backend się uruchomił
Start-Sleep -Seconds 3

# Uruchom frontend w osobnym oknie PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "✅ Backend uruchomiony na http://localhost:8000" -ForegroundColor Cyan
Write-Host "✅ Frontend uruchomiony na http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Aby zatrzymać serwery, zamknij oba okna PowerShell." -ForegroundColor Yellow

