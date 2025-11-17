
Write-Host "Fixing api.js duplicate exports..." -ForegroundColor Cyan

$file = "frontend\src\services\api.js"
$backup = "$file.backup"

# Create backup
Copy-Item $file $backup -Force
Write-Host "[OK] Backup created: $backup" -ForegroundColor Green

# Read file
$content = Get-Content $file -Raw

# Find the position of the duplicate section
$lines = $content -split "`r?`n"

# Keep everything up to line 281 (before duplicates start)
$cleanContent = @()
$inDuplicateSection = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]

    # Stop before the duplicate "Add these functions" comment
    if ($line -match "^// Add these functions to your existing api\.js file") {
        $inDuplicateSection = $true
        break
    }

    $cleanContent += $line
}

# Write cleaned content
$cleanContent -join "`n" | Set-Content $file -Encoding UTF8 -NoNewline

Write-Host "[OK] Removed duplicate exports" -ForegroundColor Green
Write-Host "Original lines: $($lines.Count)" -ForegroundColor Gray
Write-Host "Cleaned lines: $($cleanContent.Count)" -ForegroundColor Gray
