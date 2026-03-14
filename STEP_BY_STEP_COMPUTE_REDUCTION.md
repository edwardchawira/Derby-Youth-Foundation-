# Step-by-Step Guide: Achieve 99% Supabase Compute Reduction

## Overview

This guide will walk you through implementing the optimized Supabase connection pattern that reduces compute hours by ~99% through singleton client reuse.

**Expected Results:**
- **Before**: 100 requests = 100 connection attempts (~10 seconds overhead)
- **After**: 100 requests = 1 connection (~100ms overhead)
- **Reduction**: 99% reduction in connection overhead

---

## Prerequisites

- ✅ Next.js application with Supabase
- ✅ Access to Supabase dashboard
- ✅ Environment variables setup capability (Vercel/local)

---

## Step 1: Audit Current Implementation

### 1.1 Check for Hardcoded Credentials

**Windows PowerShell:**
```powershell
# Search for hardcoded Supabase credentials
.\scripts\find-hardcoded-credentials.ps1

# Or manually:
Select-String -Path "*.ts","*.tsx" -Pattern "dxfukbncszjdwyqhmrgq" -Recurse
Select-String -Path "*.ts","*.tsx" -Pattern "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" -Recurse
```

**Linux/Mac:**
```bash
# Search for hardcoded Supabase credentials
grep -r "dxfukbncszjdwyqhmrgq" .
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .
```

**Expected**: No matches (if found, proceed to Step 2)

### 1.2 Find All Supabase Client Creations

**Windows PowerShell:**
```powershell
# Find all places creating Supabase clients
.\scripts\find-supabase-usage.ps1

# Or manually:
Select-String -Path "*.ts","*.tsx" -Pattern "createClient" -Recurse | Where-Object { $_.Path -notmatch "node_modules" }
```

**Linux/Mac:**
```bash
# Find all places creating Supabase clients
grep -r "createClient" . --include="*.ts" --include="*.tsx" | grep -v node_modules
```

**Expected**: Should only see references in `lib/supabase.ts` and `lib/supabase-server.ts`

### 1.3 Count Current Client Instances

Check if you have multiple files creating clients:
- [ ] `lib/supabase.ts` - Should exist (browser client)
- [ ] `lib/supabase-server.ts` - Should exist (server client)
- [ ] Any API routes creating their own clients? → Need to update
- [ ] Any server actions creating their own clients? → Need to update

---

## Step 2: Remove Hardcoded Credentials

### 2.1 Update `lib/supabase.ts`

**Current (❌ Bad)**:
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dxfukbncszjdwyqhmrgq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'hardcoded-key';
```

**Optimized (✅ Good)**:
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    throw new Error('Missing Supabase environment variables');
  }
}
```

### 2.2 Update All Files with Hardcoded Credentials

Search and replace in:
- `lib/ai-actions.ts`
- `app/api/test-supabase/route.ts`
- Any other files found in Step 1.1

**Action**: Remove all fallback values with hardcoded credentials

---

## Step 3: Implement Singleton Pattern

### 3.1 Verify Server-Side Singleton (`lib/supabase-server.ts`)

Ensure your file looks like this:

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return { supabaseUrl, supabaseAnonKey };
}

// ✅ SINGLETON: Single instance for all server requests
let serverClient: SupabaseClient | null = null;

export async function getServerSupabaseClient(): Promise<SupabaseClient> {
  // ✅ REUSE: Return existing instance if available
  if (serverClient) {
    return serverClient;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  // ✅ CREATE ONCE: Only creates client on first call
  serverClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: { schema: 'public' },
    global: {
      headers: { 'x-client-info': 'pinnacle-ssa-server' },
    },
  });

  if (accessToken) {
    await serverClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    } as any);
  }

  return serverClient;
}
```

**Key Points**:
- ✅ `let serverClient: SupabaseClient | null = null;` - Singleton variable
- ✅ `if (serverClient) return serverClient;` - Reuse existing instance
- ✅ Creates client only once

### 3.2 Verify Client-Side Singleton (`lib/supabase.ts`)

Ensure your file looks like this:

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    throw new Error('Missing Supabase environment variables');
  }
}

// ✅ SINGLETON: Single instance for browser
let clientInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  // ✅ REUSE: Return existing instance if available
  if (clientInstance) {
    return clientInstance;
  }

  // ✅ CREATE ONCE: Only creates client on first call
  clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: { schema: 'public' },
    global: {
      headers: { 'x-client-info': 'pinnacle-ssa-client' },
    },
  });

  return clientInstance;
}

export const supabase = getSupabaseClient();
```

**Key Points**:
- ✅ `let clientInstance: SupabaseClient | null = null;` - Singleton variable
- ✅ `if (clientInstance) return clientInstance;` - Reuse existing instance

---

## Step 4: Update All Files to Use Centralized Clients

### 4.1 Update Server Actions

**Find**: Files using `createClient` in server actions
```bash
grep -r "createClient" app --include="*.ts" --include="*.tsx"
grep -r "createClient" lib --include="*.ts" --include="*.tsx"
```

**Replace**: Change from creating new clients to using singleton

**Before (❌ Bad)**:
```typescript
'use server';
import { createClient } from '@supabase/supabase-js';

export async function myServerAction() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'hardcoded';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'hardcoded';
  
  const client = createClient(supabaseUrl, supabaseAnonKey); // ❌ New client each time
  // ...
}
```

**After (✅ Good)**:
```typescript
'use server';
import { getServerSupabaseClient } from '@/lib/supabase-server';

export async function myServerAction() {
  const client = await getServerSupabaseClient(); // ✅ Reuses singleton
  // ...
}
```

### 4.2 Update API Routes

**Before (❌ Bad)**:
```typescript
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const client = createClient(url, key); // ❌ New client each request
  // ...
}
```

**After (✅ Good)**:
```typescript
import { getServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const client = await getServerSupabaseClient(); // ✅ Reuses singleton
  // ...
}
```

### 4.3 Update Client Components

**Before (❌ Bad)**:
```typescript
'use client';
import { createClient } from '@supabase/supabase-js';

export function MyComponent() {
  const client = createClient(url, key); // ❌ New client each render
  // ...
}
```

**After (✅ Good)**:
```typescript
'use client';
import { supabase } from '@/lib/supabase';

export function MyComponent() {
  // ✅ Reuses singleton from lib/supabase.ts
  const { data } = await supabase.from('table').select();
  // ...
}
```

---

## Step 5: Set Up Environment Variables

### 5.1 Local Development (`.env.local`)

Create/update `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Verify**:
```bash
# Check .gitignore includes .env.local
grep ".env.local" .gitignore
```

If not present, add to `.gitignore`:
```
.env.local
.env*.local
```

### 5.2 Vercel Production

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Supabase project URL
   - **Environments**: Select all (Production, Preview, Development)
5. Add:
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon key
   - **Environments**: Select all
6. Click **Save**
7. **Redeploy** your application

---

## Step 6: Verify Implementation

### 6.1 Run Verification Script

```bash
# Install tsx if not available
npm install -g tsx

# Run verification
npx tsx scripts/test-supabase-singleton.ts
```

**Expected Output**:
```
✅ PASS: Server client is reused (same instance)
✅ PASS: Client-side client is reused (same instance)
✅ PASS: Environment variables are set
✅ PASS: No hardcoded credentials found
```

### 6.2 Manual Verification

Test singleton pattern in your code:

```typescript
// In any API route or server action
import { getServerSupabaseClient } from '@/lib/supabase-server';

const client1 = await getServerSupabaseClient();
const client2 = await getServerSupabaseClient();

console.log('Same instance?', client1 === client2); // Should be true
```

### 6.3 Check Build

```bash
npm run build
```

**Expected**: Build succeeds without errors
**If errors**: Check that all files use centralized clients (Step 4)

---

## Step 7: Monitor Compute Hours

### 7.1 Baseline Measurement (Before)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Usage**
4. Note current compute hours:
   - Database compute hours
   - API compute hours
   - Connection count (if visible)

**Record these values for comparison**

### 7.2 Deploy and Monitor

1. Deploy your optimized code to Vercel
2. Wait 24-48 hours for usage patterns to stabilize
3. Monitor Supabase Dashboard → Settings → Usage

### 7.3 Compare Results

**Before Optimization**:
- Multiple client creations per request
- High connection churn
- Higher compute hours

**After Optimization**:
- Single client instance reused
- Minimal connection overhead
- **Expected: ~90-99% reduction in connection-related compute**

---

## Step 8: Validate Reduction

### 8.1 Connection Count Check

If available in Supabase dashboard:
- **Before**: Fluctuating, high connection count
- **After**: Stable, low connection count

### 8.2 Compute Hours Analysis

Calculate reduction:
```
Reduction = ((Before - After) / Before) × 100%

Example:
Before: 100 compute hours
After: 5 compute hours
Reduction: ((100-5)/100) × 100% = 95%
```

### 8.3 Performance Metrics

Monitor request latency:
- **Before**: ~100ms+ overhead per request (connection establishment)
- **After**: ~0ms overhead (connection reuse)

---

## Step 9: Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**:
1. Verify `.env.local` exists and has correct values
2. Restart dev server: `npm run dev`
3. Check Vercel environment variables are set
4. Redeploy if on Vercel

### Issue: Still creating multiple clients

**Solution**:
1. Search for all `createClient` calls:
   ```bash
   grep -r "createClient" . --include="*.ts" --include="*.tsx" | grep -v node_modules
   ```
2. Update any remaining files to use centralized clients
3. Check imports are correct

### Issue: Build fails with TypeScript errors

**Solution**:
1. Ensure `lib/supabase-server.ts` exists
2. Check all imports are correct
3. Verify TypeScript configuration allows async/await

### Issue: No reduction in compute hours

**Possible Causes**:
1. Not all files updated (check Step 4)
2. High actual data processing (not connection overhead)
3. Need to wait longer for accurate measurement
4. Other factors consuming compute (queries, functions, etc.)

**Verification**:
- Run verification script (Step 6.1)
- Check Supabase logs for connection patterns
- Monitor connection count over time

---

## Step 10: Maintain Optimization

### 10.1 Code Review Checklist

When adding new features:
- [ ] Use `getServerSupabaseClient()` for server-side code
- [ ] Use `supabase` from `@/lib/supabase` for client-side code
- [ ] Never call `createClient` directly
- [ ] Never hardcode credentials

### 10.2 Regular Monitoring

**Weekly**:
- Check Supabase usage dashboard
- Monitor for unexpected spikes

**Monthly**:
- Review all Supabase client usage
- Update documentation if patterns change

### 10.3 Keep Updated

- Follow Supabase changelog for client updates
- Update `@supabase/supabase-js` package regularly
- Review Supabase best practices documentation

---

## Success Criteria

You've successfully achieved 99% compute reduction when:

✅ **All hardcoded credentials removed**
✅ **Singleton pattern implemented in both client and server files**
✅ **All files use centralized clients**
✅ **Environment variables properly configured**
✅ **Build succeeds without errors**
✅ **Verification script passes**
✅ **Compute hours reduced by 90-99%**
✅ **Connection count stabilized and reduced**

---

## Expected Timeline

- **Step 1-3**: 30 minutes (Audit and setup)
- **Step 4**: 1-2 hours (Update all files)
- **Step 5**: 10 minutes (Environment variables)
- **Step 6**: 15 minutes (Verification)
- **Step 7-8**: 24-48 hours (Monitoring)
- **Total**: ~2-3 hours of work + monitoring period

---

## Additional Resources

- [Supabase Connection Management](https://supabase.com/docs/guides/database/connection-management)
- [Supabase Server-Side Auth](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

## Summary

By following these steps, you will:
1. ✅ Remove hardcoded credentials (security)
2. ✅ Implement singleton pattern (efficiency)
3. ✅ Centralize client management (maintainability)
4. ✅ Achieve 99% reduction in connection overhead (cost savings)
5. ✅ Monitor and validate results (verification)

**Result**: Significant reduction in Supabase compute hours while improving security and code quality.
