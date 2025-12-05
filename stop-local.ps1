$backendJob = Get-Job -Name synterra-backend -ErrorAction SilentlyContinue
if ($backendJob) {
    Write-Host "Stopping backend job synterra-backend" -ForegroundColor Yellow
    Stop-Job $backendJob
    Remove-Job $backendJob
} else {
    Write-Host "No backend job named synterra-backend found" -ForegroundColor DarkYellow
}

# Attempt to kill Vite preview if running on default port
try {
    $connections = Get-NetTCPConnection -LocalPort 4174 -State Listen -ErrorAction Stop
    foreach ($conn in $connections) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -match 'node|npm') {
            Write-Host "Stopping frontend process (PID $($proc.Id))" -ForegroundColor Yellow
            $proc.CloseMainWindow() | Out-Null
            Start-Sleep -Seconds 2
            if (!$proc.HasExited) {
                $proc.Kill()
            }
        }
    }
} catch {
    Write-Host "Frontend preview not detected on port 4174" -ForegroundColor DarkYellow
}

