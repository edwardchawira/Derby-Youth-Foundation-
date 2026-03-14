# PowerShell script to find all Supabase client usage
# Usage: .\scripts\find-supabase-usage.ps1

Write-Host "=== Finding All Supabase Client Usage ===" -ForegroundColor Cyan
Write-Host ""

# Find all files importing or using Supabase
Write-Host "Files using Supabase:" -ForegroundColor Yellow

$supabaseFiles = Get-ChildItem -Path . -Include "*.ts","*.tsx","*.js","*.jsx" -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { 
        $_.FullName -notmatch "node_modules" -and 
        $_.FullName -notmatch "\.next" -and
        $_.FullName -notmatch "scripts\\"
    } |
    Select-String -Pattern "@supabase|supabase|getServerSupabaseClient" -ErrorAction SilentlyContinue |
    Select-Object -Unique Path

$supabaseFiles | ForEach-Object {
    $file = $_.Path
    Write-Host "  📄 $file" -ForegroundColor White
    
    # Check what pattern it uses
    $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
    if ($content) {
        # Check if this is a singleton implementation file (expected to use createClient)
        $isSingletonFile = $file -match "lib\\supabase\.ts$|lib\\supabase-server\.ts$"
        $isEdgeFunction = $file -match "supabase\\functions|EDGE_FUNCTIONS"
        
        if ($content -match "createClient") {
            if ($isSingletonFile) {
                Write-Host "     ✅ Uses createClient (singleton implementation - expected)" -ForegroundColor Green
            } elseif ($isEdgeFunction) {
                Write-Host "     ✅ Uses createClient (edge function - Deno environment - expected)" -ForegroundColor Green
            } else {
                Write-Host "     ⚠️  Uses createClient directly (should use singleton)" -ForegroundColor Yellow
            }
        }
        if ($content -match "getServerSupabaseClient") {
            Write-Host "     ✅ Uses getServerSupabaseClient (server singleton)" -ForegroundColor Green
        }
        if ($content -match "from '@/lib/supabase'|from.*lib/supabase") {
            Write-Host "     ✅ Uses supabase from lib/supabase (client singleton)" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
$totalFiles = ($supabaseFiles | Measure-Object).Count
Write-Host "Total files using Supabase: $totalFiles" -ForegroundColor White
