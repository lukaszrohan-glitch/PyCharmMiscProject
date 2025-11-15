[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$url = 'https://github.com/cloudflare/cloudflared/releases/download/2024.11.0/cloudflared-windows-amd64.exe'
Write-Host 'Downloading cloudflared...' -ForegroundColor Cyan

try {
    Invoke-WebRequest -Uri $url -OutFile 'cloudflared.exe' -ErrorAction Stop
    Write-Host '[OK] Downloaded successfully' -ForegroundColor Green
    .\cloudflared.exe --version
} catch {
    Write-Host "[ERROR] Download failed: $_" -ForegroundColor Red
    exit 1
}
