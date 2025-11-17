$sshHost = "serwer2581752@serwer2581752.home.pl"
Write-Host "Testing SSH connection to $sshHost" -ForegroundColor Yellow
$result = ssh $sshHost "echo 'SSH OK'" 2>&1
Write-Host "Exit Code: $LASTEXITCODE" -ForegroundColor Cyan
Write-Host "Result output: $result" -ForegroundColor Cyan
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: SSH connection failed" -ForegroundColor Red
} else {
    Write-Host "SUCCESS: SSH connection worked" -ForegroundColor Green
}
