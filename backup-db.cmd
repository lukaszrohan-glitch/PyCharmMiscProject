@echo off
setlocal EnableDelayedExpansion

echo Creating database backup...
echo Timestamp: %date% %time%
echo.

REM Create backups directory if it doesn't exist
if not exist backups mkdir backups

REM Backup file with timestamp
set BACKUP_FILE=backups\backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=!BACKUP_FILE: =0!

REM Create backup
echo Creating backup to %BACKUP_FILE%...
docker-compose exec -T db pg_dump -U smb_user smbtool > "%BACKUP_FILE%" 2>backups\error.log

if errorlevel 1 (
    echo ERROR: Backup failed! Check backups\error.log for details.
    type backups\error.log
    pause
    exit /b 1
)

echo.
echo Backup completed successfully!
echo File: %BACKUP_FILE%
echo.
pause
