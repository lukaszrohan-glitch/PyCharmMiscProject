param(
    [Parameter(Mandatory=$true)]
    $Files,
    [Parameter(Mandatory=$true)]
    [string]$Message
)

# Normalize $Files to an array of trimmed file paths
if ($null -eq $Files) {
    Write-Error "No files provided. Use -Files '<file1;file2;...>' or pass an array."; exit 1
}

if ($Files -is [System.Array]) {
    $fileList = $Files | ForEach-Object { $_.ToString().Trim() } | Where-Object { $_ -ne '' }
} else {
    # Accept semicolon, comma or pipe as separators
    $fileList = ($Files -split '[,;|]') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
}

if ($fileList.Count -eq 0) {
    Write-Error "No valid files found after parsing -Files argument."; exit 1
}

Write-Host "Checking files to add..." -ForegroundColor Cyan
$normalAdds = New-Object System.Collections.ArrayList
$forcedAdds = New-Object System.Collections.ArrayList

foreach ($f in $fileList) {
    # If path is in frontend/dist, always force add (common case for built assets)
    if ($f -like 'frontend/dist*' -or $f -like '*frontend/dist/*') {
        Write-Host "Will force-add (dist path): $f" -ForegroundColor Yellow
        [void]$forcedAdds.Add($f)
        continue
    }

    # Use git check-ignore to detect if path is ignored. Exit code 0 -> ignored, 1 -> not ignored, other -> treat as unknown (force-add)
    & git check-ignore -q -- $f
    $rc = $LASTEXITCODE
    if ($rc -eq 0) {
        Write-Host "File is ignored by gitignore: $f" -ForegroundColor Yellow
        [void]$forcedAdds.Add($f)
    } elseif ($rc -eq 1) {
        [void]$normalAdds.Add($f)
    } else {
        # Unexpected return from git check-ignore (e.g., path not present or error) - treat as forced to avoid failures
        Write-Host "git check-ignore returned $rc for $f; will force-add to be safe" -ForegroundColor Yellow
        [void]$forcedAdds.Add($f)
    }
}

# Run git add for normal files (if any)
if ($normalAdds.Count -gt 0) {
    Write-Host "Running: git add $($normalAdds -join ' ')" -ForegroundColor Yellow
    & git add -- $normalAdds
    if ($LASTEXITCODE -ne 0) {
        Write-Error "git add (normal) failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE
    }
}

# Run git add -f for forced files (if any)
if ($forcedAdds.Count -gt 0) {
    Write-Host "Running (force): git add -f $($forcedAdds -join ' ')" -ForegroundColor Yellow
    & git add -f -- $forcedAdds
    if ($LASTEXITCODE -ne 0) {
        Write-Error "git add -f failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE
    }
}

# Commit
Write-Host "Committing with message: $Message" -ForegroundColor Cyan
& git commit -m "$Message"
if ($LASTEXITCODE -ne 0) { Write-Error "git commit failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }

Write-Host "Commit finished." -ForegroundColor Green

# ADD THIS PART
Write-Host "Pushing to origin main..." -ForegroundColor Cyan
& git push origin main
if ($LASTEXITCODE -ne 0) { Write-Error "git push failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }

Write-Host "Push successful. Deployment should trigger now." -ForegroundColor Green
