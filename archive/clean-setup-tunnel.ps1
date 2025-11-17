# Ensure running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Requesting administrator privileges..."
    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`""
    Exit
}

# Set working directory
$WorkingDir = "C:\Users\lukas\PyCharmMiscProject"
Set-Location -Path $WorkingDir

Write-Host "Setting up Cloudflare tunnel..."

# Define paths
$CloudflaredDir = "$env:USERPROFILE\.cloudflared"
$ServiceName = "cloudflared"

# Kill any running cloudflared processes
Write-Host "Stopping any running cloudflared processes..."
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 5

# Function to ensure service is completely removed
function Remove-CloudflaredService {
    Write-Host "Performing thorough service cleanup..."

    # Try standard service stop
    if (Get-Service $ServiceName -ErrorAction SilentlyContinue) {
        Stop-Service $ServiceName -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 5
    }

    # Use cloudflared's uninstall
    Write-Host "Running cloudflared service uninstall..."
    & "$WorkingDir\cloudflared.exe" service uninstall
    Start-Sleep -Seconds 5

    # Force remove with sc
    Write-Host "Forcing service removal..."
    sc.exe stop $ServiceName 2>$null
    Start-Sleep -Seconds 3
    sc.exe delete $ServiceName 2>$null
    Start-Sleep -Seconds 3

    # Kill any remaining processes again
    Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

# Clean up existing installation
Write-Host "Cleaning up existing installation..."
Remove-CloudflaredService

# Remove existing cloudflared directory
if (Test-Path $CloudflaredDir) {
    Write-Host "Removing existing configuration..."
    Remove-Item -Path $CloudflaredDir -Recurse -Force
    Start-Sleep -Seconds 3
}

# Create fresh cloudflared directory
Write-Host "Creating fresh configuration directory..."
New-Item -ItemType Directory -Force -Path $CloudflaredDir | Out-Null

# Copy configuration files with environment variable expansion
Write-Host "Copying configuration files..."
$configContent = Get-Content "$WorkingDir\cloudflared.yml" | ForEach-Object {
    $_ -replace '%USERPROFILE%', $env:USERPROFILE
}
$configContent | Set-Content "$CloudflaredDir\config.yml"
Copy-Item "$WorkingDir\creds.json" "$CloudflaredDir\cert.json" -Force

# Create new service with delay
Write-Host "Installing service with token..."
$token = "eyJhIjoiMWQzYWI2ZDU4ZjZkZjQ1NTEwMTlkOTZhMTQ3MmJkNGIiLCJ0IjoiNTc3NWFkZDktMjQxNS00ZDc0LWJkZTItNDk3MWFjMTE2OTY3IiwicyI6Ik0ySXlOR1EwTmpNdFlUSTJaaTAwT0RJMUxUbGlOV0V0TTJFNU1UTmtOR1ZhTVRjNSJ9"

# Double-check no service exists
Remove-CloudflaredService

Write-Host "Installing new service..."
& "$WorkingDir\cloudflared.exe" service install $token
Start-Sleep -Seconds 10

# Attempt to start service with retry
$maxRetries = 3
$retryCount = 0
$started = $false

while ($retryCount -lt $maxRetries -and -not $started) {
    Write-Host "Attempting to start service (Attempt $($retryCount + 1) of $maxRetries)..."
    Start-Service $ServiceName -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 10

    $service = Get-Service $ServiceName -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq 'Running') {
        $started = $true
        Write-Host "Service started successfully!"
    } else {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "Service failed to start, retrying after cleanup..."
            Remove-CloudflaredService
            Start-Sleep -Seconds 5
        }
    }
}

# Final status check
$service = Get-Service $ServiceName -ErrorAction SilentlyContinue
Write-Host "Final Service Status: $($service.Status)"

# Test tunnel connection
Write-Host "`nTesting tunnel connection..."
& "$WorkingDir\cloudflared.exe" tunnel info arkuszowniasmb2

Write-Host "`nChecking DNS routing..."
& "$WorkingDir\cloudflared.exe" tunnel route dns arkuszowniasmb2 arkuszowniasmb.pl

Write-Host "`nSetup complete. Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
