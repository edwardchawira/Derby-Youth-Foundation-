# Edge Functions Duplicate Analysis

## Summary

**Found 7 potential duplicate edge functions** between:
- `supabase/functions/` (deployed/active functions)
- `EDGE_FUNCTIONS_SUPABASE/` (legacy files)

## Duplicate Functions Found

| Legacy File | Deployed Function | Status |
|------------|-------------------|--------|
| `list-equipment.ts` | `vapi-list-equipment` | ⚠️ Potential duplicate |
| `vapi-check-availability.ts` | `vapi-check-availability` | ⚠️ Potential duplicate |
| `vapi-create-booking.ts` | `vapi-create-booking` | ⚠️ Potential duplicate |
| `vapi-get-available-slots.ts` | `vapi-get-available-slots` | ⚠️ Potential duplicate |
| `vapi-get-pricing.ts` | `vapi-get-pricing` | ⚠️ Potential duplicate |
| `vapi-list-bookings.ts` | `vapi-list-bookings` | ⚠️ Potential duplicate |
| `vapi-update-booking.ts` | `vapi-update-booking` | ⚠️ Potential duplicate |

## Analysis

### Deployed Functions (Active)
**Location**: `supabase/functions/`
**Total**: 14 functions
- ✅ These are the **active, deployed** functions
- ✅ These are what Supabase actually runs
- ✅ These should be kept

### Legacy Files (Potentially Unused)
**Location**: `EDGE_FUNCTIONS_SUPABASE/`
**Total**: 8 files (7 functions + 1 README)
- ⚠️ These appear to be **legacy/backup** files
- ⚠️ May be duplicates of deployed functions
- ⚠️ May be templates or old versions

## Recommendation

### Option 1: Remove Legacy Files (Recommended if duplicates)

If the legacy files are confirmed duplicates:

```powershell
# Backup first (optional)
Copy-Item -Path "EDGE_FUNCTIONS_SUPABASE" -Destination "EDGE_FUNCTIONS_SUPABASE.backup" -Recurse

# Remove legacy directory
Remove-Item -Path "EDGE_FUNCTIONS_SUPABASE" -Recurse -Force
```

**Benefits**:
- ✅ Reduces codebase clutter
- ✅ Eliminates confusion about which version is active
- ✅ Reduces maintenance burden
- ✅ Cleaner repository

### Option 2: Keep as Templates/Backups

If the legacy files serve as templates or backups:

1. **Rename directory** to clarify purpose:
   ```powershell
   Rename-Item -Path "EDGE_FUNCTIONS_SUPABASE" -NewName "edge-functions-templates"
   ```

2. **Add documentation** explaining their purpose:
   - Create `EDGE_FUNCTIONS_SUPABASE/README.md` explaining they are templates/backups
   - Document when to use them vs deployed functions

### Option 3: Compare and Merge (If different)

If files have different functionality:

1. **Compare each pair** of files
2. **Identify differences**
3. **Merge improvements** into deployed versions
4. **Remove legacy** after merging

## Verification Steps

Before removing, verify:

1. **Check if legacy files are referenced anywhere**:
   ```powershell
   Select-String -Path "*.ts","*.tsx","*.md" -Pattern "EDGE_FUNCTIONS_SUPABASE" -Recurse
   ```

2. **Compare file contents** to confirm they're duplicates:
   ```powershell
   Compare-Object (Get-Content "EDGE_FUNCTIONS_SUPABASE/vapi-check-availability.ts") (Get-Content "supabase/functions/vapi-check-availability/index.ts")
   ```

3. **Check git history** to see when legacy files were last modified:
   ```powershell
   git log --oneline -- "EDGE_FUNCTIONS_SUPABASE/"
   ```

## Action Plan

### Step 1: Verify Duplicates
- [ ] Compare content of each pair
- [ ] Check if legacy files are referenced
- [ ] Review git history

### Step 2: Make Decision
- [ ] If duplicates → Remove legacy files
- [ ] If templates → Rename and document
- [ ] If different → Merge and remove

### Step 3: Clean Up
- [ ] Remove or rename `EDGE_FUNCTIONS_SUPABASE/`
- [ ] Update documentation
- [ ] Update `.gitignore` if needed

## Impact on Supabase Compute Hours

**Removing duplicates will NOT affect compute hours** because:
- ✅ Only deployed functions in `supabase/functions/` are executed
- ✅ Legacy files in `EDGE_FUNCTIONS_SUPABASE/` are not deployed
- ✅ This is purely a code organization improvement

## Next Steps

1. Run verification script: `.\scripts\check-duplicate-edge-functions.ps1`
2. Compare file contents to confirm duplicates
3. Make decision based on findings
4. Execute cleanup plan
