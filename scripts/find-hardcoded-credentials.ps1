# PowerShell script to find hardcoded Supabase credentials
# Usage: .\scripts\find-hardcoded-credentials.ps1

Write-Host "=== Searching for Hardcoded Supabase Credentials ===" -ForegroundColor Cyan
Write-Host ""

# Search for hardcoded Supabase URL
Write-Host "1. Searching for hardcoded Supabase URL..." -ForegroundColor Yellow
$urlMatches = Get-ChildItem -Path . -Include "*.ts","*.tsx","*.js","*.jsx","*.md" -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "\.next" } |
    Select-String -Pattern "dxfukbncszjdwyqhmrgq" -ErrorAction SilentlyContinue

if ($urlMatches) {
    Write-Host "   ❌ Found hardcoded URL in:" -ForegroundColor Red
    $urlMatches | ForEach-Object {
        Write-Host "      $($_.Path):$($_.LineNumber)" -ForegroundColor White
        Write-Host "         $($_.Line.Trim())" -ForegroundColor Gray
    }
} else {
    Write-Host "   ✅ No hardcoded URL found" -ForegroundColor Green
}

Write-Host ""

# Search for hardcoded Supabase anon key
Write-Host "2. Searching for hardcoded Supabase anon key..." -ForegroundColor Yellow
$keyMatches = Get-ChildItem -Path . -Include "*.ts","*.tsx","*.js","*.jsx","*.md" -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "\.next" } |
    Select-String -Pattern "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" -ErrorAction SilentlyContinue

if ($keyMatches) {
    Write-Host "   ❌ Found hardcoded key in:" -ForegroundColor Red
    $keyMatches | ForEach-Object {
        Write-Host "      $($_.Path):$($_.LineNumber)" -ForegroundColor White
        Write-Host "         $($_.Line.Trim().Substring(0, [Math]::Min(80, $_.Line.Trim().Length)))..." -ForegroundColor Gray
    }
} else {
    Write-Host "   ✅ No hardcoded key found" -ForegroundColor Green
}

Write-Host ""

# Search for createClient calls (potential multiple client instances)
Write-Host "3. Searching for createClient calls (should only be in lib/supabase files)..." -ForegroundColor Yellow
$createClientMatches = Get-ChildItem -Path . -Include "*.ts","*.tsx","*.js","*.jsx" -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { 
        $_.FullName -notmatch "node_modules" -and 
        $_.FullName -notmatch "\.next" -and
        $_.FullName -notmatch "lib\\supabase\.ts$" -and
        $_.FullName -notmatch "lib\\supabase-server\.ts$" -and
        $_.FullName -notmatch "scripts\\" -and
        $_.FullName -notmatch "EDGE_FUNCTIONS"
    } |
    Select-String -Pattern "createClient" -ErrorAction SilentlyContinue

if ($createClientMatches) {
    Write-Host "   ⚠️  Found createClient calls outside lib/supabase files:" -ForegroundColor Yellow
    $createClientMatches | ForEach-Object {
        Write-Host "      $($_.Path):$($_.LineNumber)" -ForegroundColor White
        Write-Host "         $($_.Line.Trim())" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "   💡 These should use getServerSupabaseClient() or supabase from lib/supabase" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ All createClient calls are in appropriate files" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Search Complete ===" -ForegroundColor Cyan
