param(
    [int]$RetentionDays = 30,
    [string]$BackupPath = "backups",
    [switch]$Compress = $true
)

$ErrorActionPreference = "Stop"

try {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "$BackupPath\backup_${timestamp}.sql"
    
    if (-not (Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath | Out-Null
    }
    
    Write-Host "Starting database backup..." -ForegroundColor Cyan
    Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "Output: $backupFile"
    Write-Host ""
    
    docker-compose exec -T db pg_dump -U smb_user smbtool 2>$null | Out-File -FilePath $backupFile -Encoding UTF8
    
    if (-not (Test-Path $backupFile)) {
        throw "Backup file was not created"
    }
    
    $fileSize = (Get-Item $backupFile).Length / 1MB
    Write-Host "✓ Backup created successfully" -ForegroundColor Green
    Write-Host "  File size: $([Math]::Round($fileSize, 2)) MB"
    
    if ($Compress) {
        Write-Host "Compressing backup..."
        $zipFile = "${backupFile}.zip"
        Compress-Archive -Path $backupFile -DestinationPath $zipFile -Force
        Remove-Item $backupFile
        $zipSize = (Get-Item $zipFile).Length / 1MB
        Write-Host "✓ Compressed: $([Math]::Round($zipSize, 2)) MB" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Cleaning up old backups (retention: $RetentionDays days)..."
    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    $oldBackups = Get-ChildItem -Path $BackupPath -Filter "backup_*.sql*" -ErrorAction SilentlyContinue | 
        Where-Object { $_.LastWriteTime -lt $cutoffDate }
    
    foreach ($file in $oldBackups) {
        Remove-Item $file.FullName
        Write-Host "  Removed: $($file.Name)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "Total backups in retention: $(((Get-ChildItem -Path $BackupPath -Filter 'backup_*' -ErrorAction SilentlyContinue).Count))" 
}
catch {
    Write-Host "✗ Backup failed: $_" -ForegroundColor Red
    exit 1
}
