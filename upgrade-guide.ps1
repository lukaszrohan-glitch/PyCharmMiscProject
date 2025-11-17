
Write-Host @"
╔════════════════════════════════════════════════════════════╗
║           SMB Tool - Upgrade Guide                         ║
╚════════════════════════════════════════════════════════════╝

STEP 1: ASSESS
--------------
.\assess-upgrades.ps1
→ Shows what needs upgrading

STEP 2: SECURITY (Do this first!)
----------------------------------
.\upgrade-security.ps1
→ Generates secure passwords
→ Updates .env file
→ SAVE THE CREDENTIALS IT SHOWS!

Then restart:
docker-compose down
docker-compose up -d
.\health-check-full.ps1

STEP 3: DEPENDENCIES (Recommended)
-----------------------------------
.\upgrade-dependencies.ps1
→ Updates Python packages
→ Updates npm packages

Then rebuild:
docker-compose down
docker-compose build --no-cache
docker-compose up -d

STEP 4: MONITORING (Optional)
------------------------------
.\add-monitoring.ps1
→ Adds Prometheus + Grafana

Then start:
docker-compose -f docker-compose.monitoring.yml up -d

Access at:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

═══════════════════════════════════════════════════════════

TROUBLESHOOTING
---------------
If something breaks:
1. Check logs: docker-compose logs
2. Restore backup: Copy-Item .env.backup.* .env
3. Fresh start: .\fresh-start-simple.ps1

QUICK HEALTH CHECK
------------------
.\health-check-full.ps1

═══════════════════════════════════════════════════════════
"@ -ForegroundColor Cyan

$choice = Read-Host "`nWhat would you like to do? (1=Assess, 2=Security, 3=Dependencies, 4=Monitoring, 5=Help, Q=Quit)"

switch ($choice) {
    "1" {
        Write-Host "`nRunning assessment..." -ForegroundColor Yellow
        .\assess-upgrades.ps1
    }
    "2" {
        Write-Host "`n⚠️  WARNING: This will change passwords and API keys!" -ForegroundColor Red
        $confirm = Read-Host "Continue? (yes/no)"
        if ($confirm -eq "yes") {
            .\upgrade-security.ps1
            Write-Host "`n✅ Security upgraded! Now run:" -ForegroundColor Green
            Write-Host "   docker-compose down" -ForegroundColor Yellow
            Write-Host "   docker-compose up -d" -ForegroundColor Yellow
        }
    }
    "3" {
        Write-Host "`nUpgrading dependencies..." -ForegroundColor Yellow
        .\upgrade-dependencies.ps1
        Write-Host "`n✅ Dependencies upgraded! Now run:" -ForegroundColor Green
        Write-Host "   docker-compose down" -ForegroundColor Yellow
        Write-Host "   docker-compose build --no-cache" -ForegroundColor Yellow
        Write-Host "   docker-compose up -d" -ForegroundColor Yellow
    }
    "4" {
        Write-Host "`nAdding monitoring stack..." -ForegroundColor Yellow
        .\add-monitoring.ps1
    }
    "5" {
        Write-Host "`nFor detailed help, see:" -ForegroundColor Cyan
        Write-Host "- README.md" -ForegroundColor White
        Write-Host "- docs/UPGRADE_GUIDE.md" -ForegroundColor White
    }
    "Q" {
        Write-Host "`nGoodbye!" -ForegroundColor Cyan
        exit
    }
    default {
        Write-Host "`nInvalid choice. Run script again." -ForegroundColor Red
    }
}
