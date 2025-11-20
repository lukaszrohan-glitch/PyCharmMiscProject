# Automated Database Backup Script
# Backs up PostgreSQL database with rotation policy
# Usage: .\scripts\backup-database.ps1 [-RetainDays 7]

param(
    [int]$RetainDays = 7,
    [string]$BackupDir = ".\backups",
    [string]$DatabaseUrl = $env:DATABASE_URL
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Database Backup Script ===" -ForegroundColor Cyan
Write-Host "Retention: $RetainDays days" -ForegroundColor Yellow
Write-Host "Backup directory: $BackupDir`n" -ForegroundColor Yellow

# Create backup directory if not exists
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "✓ Created backup directory" -ForegroundColor Green
}

# Parse database URL
if (!$DatabaseUrl) {
    Write-Host "✗ DATABASE_URL not set" -ForegroundColor Red
    Write-Host "Set environment variable or pass connection string" -ForegroundColor Yellow
    exit 1
}

# Extract connection details from URL
# Format: postgresql://user:password@host:port/database
if ($DatabaseUrl -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
    $dbUser = $matches[1]
    $dbPass = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]

    Write-Host "Database: $dbName" -ForegroundColor White
    Write-Host "Host: $dbHost:$dbPort`n" -ForegroundColor White
}
else {
    Write-Host "✗ Invalid DATABASE_URL format" -ForegroundColor Red
    exit 1
}

# Generate backup filename with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir "backup_${dbName}_${timestamp}.sql"
$compressedFile = "$backupFile.gz"

Write-Host "Creating backup..." -ForegroundColor Yellow

# Set password environment variable for pg_dump
$env:PGPASSWORD = $dbPass

try {
    # Run pg_dump
    $pgDumpArgs = @(
        "-h", $dbHost,
        "-p", $dbPort,
        "-U", $dbUser,
        "-d", $dbName,
        "--format=plain",
        "--no-owner",
        "--no-acl",
        "--verbose",
        "-f", $backupFile
    )

    $process = Start-Process -FilePath "pg_dump" -ArgumentList $pgDumpArgs -NoNewWindow -Wait -PassThru

    if ($process.ExitCode -ne 0) {
        Write-Host "✗ pg_dump failed with exit code $($process.ExitCode)" -ForegroundColor Red
        exit 1
    }

    # Compress backup
    Write-Host "`nCompressing backup..." -ForegroundColor Yellow

    if (Get-Command "gzip" -ErrorAction SilentlyContinue) {
        gzip -9 $backupFile
        $finalFile = $compressedFile
    }
    else {
        Write-Host "⚠ gzip not found, skipping compression" -ForegroundColor Yellow
        $finalFile = $backupFile
    }

    $fileSize = (Get-Item $finalFile).Length / 1MB
    Write-Host "✓ Backup created: $finalFile" -ForegroundColor Green
    Write-Host "  Size: $([math]::Round($fileSize, 2)) MB`n" -ForegroundColor Gray

    # Cleanup old backups
    Write-Host "Cleaning up old backups (retain $RetainDays days)..." -ForegroundColor Yellow

    $cutoffDate = (Get-Date).AddDays(-$RetainDays)
    $oldBackups = Get-ChildItem -Path $BackupDir -Filter "backup_*.sql*" |
                  Where-Object { $_.LastWriteTime -lt $cutoffDate }

    if ($oldBackups) {
        foreach ($old in $oldBackups) {
            Remove-Item $old.FullName -Force
            Write-Host "  Deleted: $($old.Name)" -ForegroundColor Gray
        }
        Write-Host "✓ Removed $($oldBackups.Count) old backup(s)" -ForegroundColor Green
    }
    else {
        Write-Host "✓ No old backups to remove" -ForegroundColor Green
    }

    # Summary
    Write-Host "`n=== Backup Complete ===" -ForegroundColor Cyan
    Write-Host "Backup file: $finalFile" -ForegroundColor White
    Write-Host "Total backups: $(( Get-ChildItem -Path $BackupDir -Filter 'backup_*.sql*').Count)" -ForegroundColor White

}
catch {
    Write-Host "✗ Backup failed: $_" -ForegroundColor Red
    exit 1
}
finally {
    # Clear password from environment
    $env:PGPASSWORD = $null
}

Write-Host "`n✓ Backup completed successfully!`n" -ForegroundColor Green

