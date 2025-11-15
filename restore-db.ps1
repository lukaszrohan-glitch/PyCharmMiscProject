param(
    [Parameter(Mandatory=$true, HelpMessage="Path to backup file (.sql or .zip)")]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

try {
    if (-not (Test-Path $BackupFile)) {
        throw "Backup file not found: $BackupFile"
    }
    
    $actualFile = $BackupFile
    
    if ($BackupFile -like "*.zip") {
        Write-Host "Extracting compressed backup..." -ForegroundColor Cyan
        $tempDir = [System.IO.Path]::GetTempPath()
        $tempFile = Join-Path $tempDir "backup_restore_$(Get-Random).sql"
        Expand-Archive -Path $BackupFile -DestinationPath $tempDir -Force
        $actualFile = Get-ChildItem -Path $tempDir -Filter "backup_*.sql" | 
            Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
    }
    
    Write-Host "Restoring database from: $(Split-Path $BackupFile -Leaf)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "WARNING: This will overwrite existing data in the database!" -ForegroundColor Yellow
    $confirmation = Read-Host "Type 'yes' to confirm restore"
    
    if ($confirmation -ne "yes") {
        Write-Host "Restore cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host ""
    Write-Host "Starting restore process..." -ForegroundColor Cyan
    
    Get-Content $actualFile | docker-compose exec -T db psql -U smb_user smbtool 2>&1 | Out-Null
    
    Write-Host "✓ Database restored successfully!" -ForegroundColor Green
    
    if ($BackupFile -like "*.zip") {
        Remove-Item $actualFile -Force
    }
}
catch {
    Write-Host "✗ Restore failed: $_" -ForegroundColor Red
    exit 1
}
