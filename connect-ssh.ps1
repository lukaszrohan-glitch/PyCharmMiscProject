param(
    [string]$Username = "serwer2581752",
    [string]$Host = "serwer2581752.home.pl",
    [string]$IdentityFile = $null,
    [switch]$PasswordAuth = $false
)

Write-Host "SSH Connection to $Username@$Host" -ForegroundColor Cyan
Write-Host ""

$sshArgs = @(
    "-v"  # verbose for debugging
    "-o", "ConnectTimeout=15"
    "-o", "StrictHostKeyChecking=no"
    "-o", "UserKnownHostsFile=/dev/null"
)

if ($PasswordAuth) {
    Write-Host "Using password authentication..." -ForegroundColor Yellow
    Write-Host "You will be prompted for the password" -ForegroundColor Gray
    & ssh @sshArgs "$Username@$Host"
}
elseif ($IdentityFile) {
    Write-Host "Using SSH key: $IdentityFile" -ForegroundColor Yellow
    $sshArgs += "-i", $IdentityFile
    & ssh @sshArgs "$Username@$Host"
}
else {
    Write-Host "Attempting SSH with default settings..." -ForegroundColor Yellow
    Write-Host "If prompted, enter your password" -ForegroundColor Gray
    & ssh @sshArgs "$Username@$Host"
}
