param(
    [string]$SSHUser = "serwer2581752",
    [string]$SSHHost = "serwer2581752.home.pl",
    [int]$SSHPort = 22222,
    [string]$SSHPassword = "Kasienka#89"
)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Deploy via SSH" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$sshTarget = "$SSHUser@$SSHHost"

Write-Host "Testing SSH connection..." -ForegroundColor Yellow

$testCmd = "pwd"
echo $SSHPassword | ssh -p $SSHPort -o StrictHostKeyChecking=no $sshTarget $testCmd 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] SSH connection successful" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now deploy with:" -ForegroundColor Cyan
    Write-Host "ssh -p $SSHPort $sshTarget" -ForegroundColor White
    Write-Host ""
    Write-Host "Or upload files:" -ForegroundColor Cyan
    Write-Host "scp -P $SSHPort -r ./dist $sshTarget:/path/to/destination" -ForegroundColor White
} else {
    Write-Host "[ERROR] SSH connection failed" -ForegroundColor Red
    exit 1
}
