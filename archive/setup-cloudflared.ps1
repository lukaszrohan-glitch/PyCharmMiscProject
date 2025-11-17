# Elevate to admin if not already
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    $arguments = "& '" + $myinvocation.mycommand.definition + "'"
    Start-Process powershell -Verb runAs -ArgumentList $arguments
    Break
}

# Stop and uninstall existing service
Write-Host "Stopping and removing existing service..."
if (Get-Service cloudflared -ErrorAction SilentlyContinue) {
    Stop-Service cloudflared -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    sc.exe delete cloudflared
    Start-Sleep -Seconds 2
}

# Set working directory
Set-Location -Path "C:\Users\lukas\PyCharmMiscProject"

# Install service with token
$token = "eyJhIjoiMWQzYWI2ZDU4ZjZkZjQ1NTEwMTlkOTZhMTQ3MmJkNGIiLCJ0IjoiNTc3NWFkZDktMjQxNS00ZDc0LWJkZTItNDk3MWFjMTE2OTY3IiwicyI6IldhdHZtalItODhvN2ZMUXBJSUotQkxOR3ZzZ2p1emFINzhkQlJkdTAifQ"
Write-Host "Installing service with token..."
& ".\cloudflared.exe" service install $token

# Wait a bit
Start-Sleep -Seconds 5

# Start service
Write-Host "Starting service..."
Start-Service cloudflared

# Show status
Write-Host "Service status:"
Get-Service cloudflared
