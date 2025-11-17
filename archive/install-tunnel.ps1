# Request admin privileges
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    $arguments = "& '" + $myinvocation.mycommand.definition + "'"
    Start-Process powershell -Verb runAs -ArgumentList $arguments
    Break
}

# Stop and remove existing service if it exists
if (Get-Service cloudflared -ErrorAction SilentlyContinue) {
    Write-Host "Removing existing cloudflared service..."
    Stop-Service cloudflared -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    & 'C:\Users\lukas\PyCharmMiscProject\cloudflared.exe' service uninstall
    Start-Sleep -Seconds 2
}

# Install the service with the new configuration
Write-Host "Installing cloudflared service with new configuration..."
Set-Location -Path "C:\Users\lukas\PyCharmMiscProject"
& '.\cloudflared.exe' service install
Start-Sleep -Seconds 2

# Start the service
Write-Host "Starting cloudflared service..."
Start-Service cloudflared
Write-Host "Cloudflared service installed and started"

# Display service status
Get-Service cloudflared
