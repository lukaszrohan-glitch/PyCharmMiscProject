# Truncate nginx error.log and access.log safely from PowerShell
param(
    [string]$NginxContainer = 'pycharmmiscproject-nginx-1'
)

Write-Host "Rotating nginx logs in container: $NginxContainer" -ForegroundColor Cyan

# Use single quotes for the sh -c argument so PowerShell doesn't expand or mangle inner quotes
$cmd = 'for f in /var/log/nginx/access.log /var/log/nginx/error.log; do if [ -f "$f" ]; then mv "$f" "$f.old" || true; touch "$f"; fi; done'

# Run the command inside the container
& docker exec $NginxContainer sh -c $cmd
$rc = $LASTEXITCODE
if ($rc -ne 0) { Write-Error "Failed to rotate logs (exit $rc)"; exit $rc }
Write-Host "Log rotation done. You can inspect /var/log/nginx/*.old for previous logs." -ForegroundColor Green
