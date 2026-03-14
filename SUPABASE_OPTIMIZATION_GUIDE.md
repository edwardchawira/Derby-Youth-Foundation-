# Supabase Connection Optimization Guide

## Problem
You were experiencing high compute hours usage because:
1. **Hardcoded credentials** in multiple files (security risk + always same instance)
2. **Multiple client instances** created instead of reusing connections
3. **No connection pooling** - each API route created new clients
4. **Same Supabase instance** used for both development and production

## Solution Implemented

### 1. Centralized Client Management

**Client-Side (Browser)**: `lib/supabase.ts`
- Singleton pattern for browser usage
- Reuses the same client instance
- Handles session persistence

**Server-Side (API Routes, Server Actions)**: `lib/supabase-server.ts`
- Singleton pattern for server usage
- Reuses connections across all API routes
- Reduces compute hours by avoiding new connections

### 2. Removed Hardcoded Credentials

**Before:**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dxfukbncszjdwyqhmrgq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'hardcoded-key';
```

**After:**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}
```

### 3. Updated Files to Use Optimized Client

- ✅ `lib/ai-actions.ts` - Now uses `getServerSupabaseClient()`
- ✅ `app/api/test-supabase/route.ts` - Now uses `getServerSupabaseClient()`
- ✅ `lib/supabase.ts` - Removed hardcoded credentials

## Connection Flow (Optimized)

```
┌─────────────────┐
│   Cursor (Dev)  │
│   .env.local    │──┐
└─────────────────┘  │
                     ├──► GitHub (No credentials)
┌─────────────────┐  │
│  Vercel (Prod)  │  │
│  Env Variables  │──┘
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Supabase API   │
│  (Single Client) │
└─────────────────┘
```

## Environment Variables Setup

### Local Development (.env.local)

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Important**: Add `.env.local` to `.gitignore` (should already be there)

### Vercel Production

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
3. Select all environments (Production, Preview, Development)
4. Redeploy

### GitHub

**DO NOT** commit credentials to GitHub. The code now requires environment variables, so:
- ✅ Code is committed (no hardcoded values)
- ✅ Credentials stay in Vercel/Cursor environment variables
- ✅ Each environment uses its own credentials

## Best Practices

### 1. Use the Right Client

**Browser/Client Components:**
```typescript
import { supabase } from '@/lib/supabase';
// Use directly - singleton handles reuse
```

**Server Actions/API Routes:**
```typescript
import { getServerSupabaseClient } from '@/lib/supabase-server';
const client = await getServerSupabaseClient();
// Reuses connection across requests
```

### 2. Connection Pooling

The singleton pattern ensures:
- One client instance per environment
- Connections are reused
- Reduced compute hours

### 3. Separate Dev/Prod Instances (Optional)

For maximum optimization, consider:
- **Development**: Use a separate Supabase project for local dev
- **Production**: Use your main Supabase project

This prevents dev testing from consuming production compute hours.

## Monitoring Compute Hours

1. Go to Supabase Dashboard → Settings → Usage
2. Monitor "Database" and "API" usage
3. Check for:
   - Unusual spikes (might indicate inefficient queries)
   - Consistent high usage (might need connection pooling upgrade)

## Additional Optimizations

### 1. Use Connection Pooling (Supabase Feature)

If you're still seeing high compute usage, enable Supabase's connection pooling:

1. In Supabase Dashboard → Settings → Database
2. Enable "Connection Pooling"
3. Use the pooler URL: `https://your-project.supabase.co` (port 6543)
4. Update your connection string to use the pooler

### 2. Query Optimization

- Use `.select()` to only fetch needed columns
- Add indexes for frequently queried fields
- Use pagination for large datasets
- Cache results when possible

### 3. Rate Limiting

- Implement client-side rate limiting
- Use Supabase's built-in rate limiting
- Consider caching for frequently accessed data

## Verification

After implementing these changes:

1. ✅ Build should succeed: `npm run build`
2. ✅ No hardcoded credentials in code
3. ✅ All API routes use `getServerSupabaseClient()`
4. ✅ Environment variables set in Vercel
5. ✅ Monitor Supabase compute hours - should see reduction

## Files Changed

- `lib/supabase.ts` - Removed hardcoded credentials, improved singleton
- `lib/supabase-server.ts` - NEW: Optimized server-side client
- `lib/ai-actions.ts` - Updated to use optimized client
- `app/api/test-supabase/route.ts` - Updated to use optimized client

## Next Steps

1. **Set environment variables** in Vercel (if not already done)
2. **Test the build**: `npm run build`
3. **Deploy to Vercel** and verify it works
4. **Monitor Supabase usage** over the next few days
5. **Consider separate dev/prod instances** if usage is still high
