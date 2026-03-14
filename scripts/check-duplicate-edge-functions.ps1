# PowerShell script to check for duplicate edge functions
# Usage: .\scripts\check-duplicate-edge-functions.ps1

Write-Host "=== Checking for Duplicate Edge Functions ===" -ForegroundColor Cyan
Write-Host ""

# Get functions from supabase/functions directory
Write-Host "1. Functions in supabase/functions/:" -ForegroundColor Yellow
$deployedFunctions = Get-ChildItem -Path "supabase\functions" -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name | Sort-Object
if ($deployedFunctions) {
    $deployedFunctions | ForEach-Object {
        Write-Host "   ✅ $_" -ForegroundColor Green
    }
    Write-Host "   Total: $($deployedFunctions.Count)" -ForegroundColor White
} else {
    Write-Host "   ⚠️  No functions found" -ForegroundColor Yellow
}

Write-Host ""

# Get files from EDGE_FUNCTIONS_SUPABASE directory
Write-Host "2. Files in EDGE_FUNCTIONS_SUPABASE/:" -ForegroundColor Yellow
$legacyFiles = Get-ChildItem -Path "EDGE_FUNCTIONS_SUPABASE" -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name | Sort-Object
if ($legacyFiles) {
    $legacyFiles | ForEach-Object {
        Write-Host "   📄 $_" -ForegroundColor Cyan
    }
    Write-Host "   Total: $($legacyFiles.Count)" -ForegroundColor White
} else {
    Write-Host "   ⚠️  No files found" -ForegroundColor Yellow
}

Write-Host ""

# Compare function names
Write-Host "3. Comparison:" -ForegroundColor Yellow

# Extract function names from legacy files (remove .ts extension and vapi- prefix if present)
$legacyFunctionNames = $legacyFiles | ForEach-Object {
    $name = $_ -replace '\.ts$', ''
    $name = $name -replace '^vapi-', ''
    $name
}

$duplicates = @()
$uniqueLegacy = @()

foreach ($legacyName in $legacyFunctionNames) {
    $match = $deployedFunctions | Where-Object { 
        $_ -eq $legacyName -or 
        $_ -eq "vapi-$legacyName" -or
        $_ -like "*$legacyName*"
    }
    
    if ($match) {
        $duplicates += [PSCustomObject]@{
            Legacy = $legacyName
            Deployed = $match
        }
    } else {
        $uniqueLegacy += $legacyName
    }
}

if ($duplicates.Count -gt 0) {
    Write-Host "   ⚠️  Potential duplicates found:" -ForegroundColor Yellow
    $duplicates | ForEach-Object {
        Write-Host "      Legacy: $($_.Legacy) → Deployed: $($_.Deployed -join ', ')" -ForegroundColor White
    }
} else {
    Write-Host "   ✅ No obvious duplicates found" -ForegroundColor Green
}

if ($uniqueLegacy.Count -gt 0) {
    Write-Host ""
    Write-Host "   📄 Legacy files with no deployed equivalent:" -ForegroundColor Cyan
    $uniqueLegacy | ForEach-Object {
        Write-Host "      $_" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "4. Detailed File Comparison:" -ForegroundColor Yellow

# Check specific files
$functionMap = @{
    "list-equipment" = @("supabase/functions/vapi-list-equipment", "EDGE_FUNCTIONS_SUPABASE/list-equipment.ts")
    "vapi-check-availability" = @("supabase/functions/vapi-check-availability", "EDGE_FUNCTIONS_SUPABASE/vapi-check-availability.ts")
    "vapi-create-booking" = @("supabase/functions/vapi-create-booking", "EDGE_FUNCTIONS_SUPABASE/vapi-create-booking.ts")
    "vapi-get-available-slots" = @("supabase/functions/vapi-get-available-slots", "EDGE_FUNCTIONS_SUPABASE/vapi-get-available-slots.ts")
    "vapi-get-pricing" = @("supabase/functions/vapi-get-pricing", "EDGE_FUNCTIONS_SUPABASE/vapi-get-pricing.ts")
    "vapi-list-bookings" = @("supabase/functions/vapi-list-bookings", "EDGE_FUNCTIONS_SUPABASE/vapi-list-bookings.ts")
    "vapi-update-booking" = @("supabase/functions/vapi-update-booking", "EDGE_FUNCTIONS_SUPABASE/vapi-update-booking.ts")
}

foreach ($funcName in $functionMap.Keys) {
    $deployedPath = $functionMap[$funcName][0]
    $legacyPath = $functionMap[$funcName][1]
    
    $deployedExists = Test-Path $deployedPath
    $legacyExists = Test-Path $legacyPath
    
    if ($deployedExists -and $legacyExists) {
        Write-Host "   ⚠️  $funcName : Both exist" -ForegroundColor Yellow
        Write-Host "      Deployed: $deployedPath" -ForegroundColor Green
        Write-Host "      Legacy: $legacyPath" -ForegroundColor Cyan
        
        # Check if files are similar (compare first few lines)
        $deployedContent = Get-Content $deployedPath -TotalCount 10 -ErrorAction SilentlyContinue
        $legacyContent = Get-Content $legacyPath -TotalCount 10 -ErrorAction SilentlyContinue
        
        if ($deployedContent -and $legacyContent) {
            $similar = ($deployedContent | Select-Object -First 5) -eq ($legacyContent | Select-Object -First 5)
            if ($similar) {
                Write-Host "      ⚠️  Files appear similar (potential duplicate)" -ForegroundColor Yellow
            } else {
                Write-Host "      ✅ Files appear different" -ForegroundColor Green
            }
        }
    } elseif ($deployedExists) {
        Write-Host "   ✅ $funcName : Only deployed version exists" -ForegroundColor Green
    } elseif ($legacyExists) {
        Write-Host "   📄 $funcName : Only legacy version exists" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "=== Analysis Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Recommendation:" -ForegroundColor Yellow
if ($duplicates.Count -gt 0) {
    Write-Host "   Consider removing legacy files in EDGE_FUNCTIONS_SUPABASE/ if they are duplicates" -ForegroundColor White
    Write-Host "   Keep the deployed versions in supabase/functions/" -ForegroundColor White
} else {
    Write-Host "   No duplicates found. Legacy files may be templates or backups." -ForegroundColor White
}
