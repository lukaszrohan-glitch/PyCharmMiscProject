# Request admin privileges if needed
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    $arguments = "& '" + $myinvocation.mycommand.definition + "'"
    Start-Process powershell -Verb runAs -ArgumentList $arguments
    Break
}

Write-Host "Checking Cloudflare configuration..."
$cloudflaredDir = "$env:USERPROFILE\.cloudflared"
$credentialsFile = "$cloudflaredDir\cert.json"
$certFile = "$cloudflaredDir\cert.pem"
$configPath = "$PSScriptRoot\cloudflared.yml"
$tunnelId = "5775add9-2415-4d74-bde2-4971ac116967"

# Ensure .cloudflared directory exists
if (-not (Test-Path $cloudflaredDir)) {
    New-Item -ItemType Directory -Path $cloudflaredDir -Force | Out-Null
}

# Verify credentials and certificates
if (-not (Test-Path $credentialsFile)) {
    Write-Host "Error: Credentials file not found. Running tunnel login..."
    & "$PSScriptRoot\cloudflared.exe" tunnel login
    if (-not (Test-Path $credentialsFile)) {
        Write-Error "Failed to obtain credentials. Please run 'cloudflared tunnel login' manually."
        exit 1
    }
}

# Ensure cert.pem exists and is properly copied
if (-not (Test-Path $certFile) -or (Get-Item $certFile).Length -eq 0) {
    Write-Host "Setting up certificate..."
    if (Test-Path $credentialsFile) {
        Copy-Item $credentialsFile $certFile -Force -ErrorAction Stop
    } else {
        Write-Error "Cannot find credentials file to copy as cert.pem"
        exit 1
    }
}

# Set environment variables for the certificate path
$env:TUNNEL_ORIGIN_CERT = $certFile
[System.Environment]::SetEnvironmentVariable('TUNNEL_ORIGIN_CERT', $certFile, [System.EnvironmentVariableTarget]::Machine)

Write-Host "Stopping Cloudflared service..."
Stop-Service -Name cloudflared -Force -ErrorAction SilentlyContinue

Write-Host "Uninstalling Cloudflared service..."
& "$PSScriptRoot\cloudflared.exe" service uninstall

Write-Host "Setting up configuration..."
# Ensure config directory exists
$configDir = "$cloudflaredDir"
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

# Copy config file to .cloudflared directory
Copy-Item $configPath "$configDir\config.yml" -Force

Write-Host "Installing Cloudflared service with explicit certificate path..."
$env:TUNNEL_ORIGIN_CERT = $certFile
& "$PSScriptRoot\cloudflared.exe" service install --config "$configDir\config.yml" --origincert "$certFile"

Write-Host "Starting service..."
Start-Sleep -Seconds 2
Start-Service cloudflared
$service = Get-Service cloudflared
Write-Host "Service Status: $($service.Status)"

# Run the tunnel with explicit certificate path
Write-Host "Running tunnel..."
& "$PSScriptRoot\cloudflared.exe" tunnel --config "$configDir\config.yml" --origincert "$certFile" run $tunnelId

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
