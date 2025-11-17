# Quick Tunnel launcher: starts cloudflared and extracts the public URL
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$cf = Join-Path $root 'cloudflared.exe'
if (-not (Test-Path $cf)) { Write-Error "cloudflared.exe not found at $cf" }

$env:QT_URL_FILE = Join-Path $root 'quick-tunnel-url.txt'
if (Test-Path $env:QT_URL_FILE) { Remove-Item $env:QT_URL_FILE -Force -ErrorAction SilentlyContinue }

Write-Host 'Starting Cloudflare Quick Tunnel to http://127.0.0.1:80 ...' -ForegroundColor Cyan

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $cf
$psi.Arguments = 'tunnel --url http://127.0.0.1:80 --loglevel info --no-autoupdate'
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $false

$p = New-Object System.Diagnostics.Process
$p.StartInfo = $psi
$null = $p.Start()

$readerOut = $p.StandardOutput
$readerErr = $p.StandardError

$regex = [regex]'https://[^\s]*trycloudflare\.com'
$url = $null

while (-not $readerOut.EndOfStream) {
    $line = $readerOut.ReadLine()
    if ($line) { Write-Host $line }
    if (-not $url) {
        $m = $regex.Match($line)
        if ($m.Success) {
            $url = $m.Value
            Set-Content -Path $env:QT_URL_FILE -Value $url -Encoding ascii
            Write-Host "\nPublic URL: $url" -ForegroundColor Green
            try { Start-Process $url } catch {}
            Write-Host '\nTunnel is running. Keep this window open to keep the tunnel alive.' -ForegroundColor Yellow
        }
    }
}

# Drain stderr (optional)
while (-not $readerErr.EndOfStream) { $readerErr.ReadLine() | Write-Host }

$p.WaitForExit()
Write-Host "cloudflared exited with code $($p.ExitCode)" -ForegroundColor DarkYellow

