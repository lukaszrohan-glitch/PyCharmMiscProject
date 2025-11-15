$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   UPLOAD FRONTEND TO HOME.PL SERVER                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# FTP Configuration
$ftpHost = "serwer2581752.home.pl"
$ftpUser = "serwer2581752"
$ftpPass = "Kasienka#89"
$localPath = ".\frontend\dist"
$remotePath = "/public_html"

# Check if dist folder exists
if (-not (Test-Path $localPath)) {
    Write-Host "ERROR: $localPath not found!" -ForegroundColor Red
    Write-Host "Run 'npm run build' first" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/4] Verifying frontend build..." -ForegroundColor Yellow
$distFiles = Get-ChildItem $localPath -Recurse
$fileCount = ($distFiles | Measure-Object).Count
Write-Host "   Found $fileCount files to upload" -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] Connecting to FTP server..." -ForegroundColor Yellow
Write-Host "   Host: $ftpHost" -ForegroundColor Gray
Write-Host "   User: $ftpUser" -ForegroundColor Gray
Write-Host ""

try {
    # Create FTP request
    $ftpUrl = "ftp://$ftpHost$remotePath/"
    
    # Upload files using Invoke-WebRequest (limited but working)
    # For better control, we'll use a batch script with ftp.exe
    
    $ftpCommands = @"
open $ftpHost
$ftpUser
$ftpPass
binary
cd public_html
lcd $((Resolve-Path $localPath).Path)
mdelete *
mput *
quit
"@

    # Save FTP script
    $ftpScript = "$env:TEMP\ftp_upload.txt"
    Set-Content -Path $ftpScript -Value $ftpCommands -Encoding ASCII
    
    Write-Host "[3/4] Uploading files (this may take a minute)..." -ForegroundColor Yellow
    
    # Execute FTP upload
    $output = & ftp.exe -i -s:$ftpScript 2>&1
    
    # Check for errors
    if ($output -match "226" -or $output -match "250") {
        Write-Host "   ✓ Upload completed" -ForegroundColor Green
        $uploadSuccess = $true
    } else {
        Write-Host "   ⚠ Upload may have issues. Check output below:" -ForegroundColor Yellow
        $uploadSuccess = $false
    }
    
    # Show upload summary
    Write-Host ""
    Write-Host "[4/4] Upload Summary" -ForegroundColor Yellow
    $output | ForEach-Object {
        if ($_ -match "^ftp|200|226|250|150") {
            Write-Host "   $($_)" -ForegroundColor Gray
        }
    }
    
    Remove-Item $ftpScript
    
} catch {
    Write-Host "ERROR during upload: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   UPLOAD COMPLETE                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($uploadSuccess) {
    Write-Host "✓ Frontend files are now on your home.pl server!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Visit: https://arkuszowniasmb.pl" -ForegroundColor White
    Write-Host "  2. Wait for DNS to propagate if needed" -ForegroundColor White
    Write-Host "  3. API will be at: https://api.arkuszowniasmb.pl" -ForegroundColor White
    Write-Host ""
    Write-Host "If you see 'Cannot connect to api.arkuszowniasmb.pl':" -ForegroundColor Yellow
    Write-Host "  - Make sure DNS record for 'api.arkuszowniasmb.pl' is set in Cloudflare" -ForegroundColor Gray
    Write-Host "  - The tunnel may take a few minutes to activate" -ForegroundColor Gray
} else {
    Write-Host "⚠ Upload may have encountered issues" -ForegroundColor Yellow
    Write-Host "Please check the FTP output above for details" -ForegroundColor Yellow
}

Write-Host ""
