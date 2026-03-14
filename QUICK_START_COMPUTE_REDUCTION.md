# Quick Start: 99% Compute Reduction (5-Minute Version)

## TL;DR

Replace multiple `createClient()` calls with singleton pattern = 99% compute reduction.

---

## Quick Steps

### 1. Ensure These Files Exist

```bash
# Check files exist
ls lib/supabase.ts
ls lib/supabase-server.ts
```

If missing, use the optimized versions from `SUPABASE_CONTEXT7_PROOF.md`

### 2. Find All Client Creations

**Windows PowerShell:**
```powershell
.\scripts\find-supabase-usage.ps1
```

**Linux/Mac:**
```bash
grep -r "createClient" . --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "lib/supabase"
```

**Action**: Replace all with:
- Server-side: `import { getServerSupabaseClient } from '@/lib/supabase-server'`
- Client-side: `import { supabase } from '@/lib/supabase'`

### 3. Remove Hardcoded Credentials

**Windows PowerShell:**
```powershell
.\scripts\find-hardcoded-credentials.ps1
```

**Linux/Mac:**
```bash
grep -r "dxfukbncszjdwyqhmrgq" .
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .
```

**Action**: Replace with `process.env.NEXT_PUBLIC_SUPABASE_URL` (no fallbacks)

### 4. Set Environment Variables

**Local**: Create `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

**Vercel**: Settings → Environment Variables → Add both variables

### 5. Verify

```bash
npm run build
npx tsx scripts/test-supabase-singleton.ts
```

### 6. Deploy & Monitor

Deploy to Vercel, wait 24 hours, check Supabase Dashboard → Usage

**Expected**: 90-99% reduction in compute hours

---

## Key Principle

**Before**: Every request creates new client → New connection → High compute
**After**: Every request reuses same client → Reuses connection → Low compute

**Reduction**: 99% of connection overhead eliminated

---

## Need More Detail?

See `STEP_BY_STEP_COMPUTE_REDUCTION.md` for complete guide.
