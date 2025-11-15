# Database Backup Strategy

## Overview

The application uses PostgreSQL with multiple backup options for data protection and disaster recovery.

## Backup Methods

### 1. Manual Backups

**Single backup (interactive):**
```powershell
.\backup-db.cmd
```

**Automated backup with compression and retention:**
```powershell
.\backup-db-auto.ps1 -RetentionDays 30 -Compress $true
```

**Parameters:**
- `-RetentionDays`: Number of days to keep backups (default: 30)
- `-Compress`: Compress backups to ZIP (default: $true)

### 2. Automatic Scheduled Backups (Windows Task Scheduler)

Create a scheduled task to run daily backups:

```powershell
$taskName = "SMB-Database-Backup"
$scriptPath = "C:\Users\lukas\PyCharmMiscProject\backup-db-auto.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At "2:00 AM"
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM"
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""
$task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal `
    -Description "Daily SMB database backup" -TaskName $taskName
Register-ScheduledTask -InputObject $task -Force
```

**To remove the scheduled task:**
```powershell
Unregister-ScheduledTask -TaskName "SMB-Database-Backup" -Confirm:$false
```

### 3. Docker Volume Backup

Backup entire database volume:
```powershell
docker-compose exec -T db pg_dump -U smb_user smbtool > full_backup.sql
```

## Restore Procedures

### From SQL backup:

```powershell
.\restore-db.ps1 -BackupFile "backups\backup_20250115_010203.sql"
```

### From compressed backup:

```powershell
.\restore-db.ps1 -BackupFile "backups\backup_20250115_010203.sql.zip"
```

### Manual Docker restore:

```powershell
Get-Content backup.sql | docker-compose exec -T db psql -U smb_user smbtool
```

## Retention Policy

- **Daily backups**: Kept for 30 days by default
- **Weekly backup**: Manual full backup kept separately
- **Monthly backup**: Archived off-site for compliance

## Backup Storage

### Recommended Setup

1. **Local backups**: `./backups/` directory (automatically created)
2. **Cloud backups**: Upload to cloud storage (AWS S3, Azure Blob, etc.)
3. **Off-site backup**: Weekly manual backup to external drive

### Cloud Backup Script (AWS S3 example)

```powershell
$backupFile = "backups\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
docker-compose exec -T db pg_dump -U smb_user smbtool | Out-File $backupFile

# Upload to S3
aws s3 cp $backupFile s3://my-bucket/database-backups/
```

## Backup Verification

Always verify backups are working:

```powershell
# List recent backups
dir backups | Sort-Object LastWriteTime -Descending | head -10

# Check backup file integrity
Get-Item backups\backup_*.sql | ForEach-Object {
    $size = $_.Length / 1MB
    Write-Host "$($_.Name): $([Math]::Round($size,2)) MB"
}

# Test restore to staging environment
.\restore-db.ps1 -BackupFile "backups\backup_latest.sql"
```

## Disaster Recovery

### Recovery Time Objective (RTO)
- **Normal restore**: 5-15 minutes
- **Disaster recovery from S3**: 15-30 minutes

### Recovery Point Objective (RPO)
- **Daily backups**: 24 hours
- **Recommended**: Implement hourly snapshots for critical data

## Security Considerations

- **Backup encryption**: Use encrypted volumes or S3 encryption
- **Access control**: Restrict backup file permissions
- **Encryption in transit**: Use HTTPS/TLS for cloud uploads
- **Credential rotation**: Rotate database credentials regularly

## Monitoring

Check backup status:
```powershell
$backups = Get-ChildItem backups\backup_*.sql* -ErrorAction SilentlyContinue
$latest = $backups | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latest) {
    $age = (Get-Date) - $latest.LastWriteTime
    Write-Host "Last backup: $($latest.Name) ($(($age).Days) days ago)"
    Write-Host "Size: $([Math]::Round($latest.Length / 1MB, 2)) MB"
}
```

## Emergency Contacts

- Database Administrator: [contact info]
- Backup Administrator: [contact info]
- Disaster Recovery Hotline: [phone number]
