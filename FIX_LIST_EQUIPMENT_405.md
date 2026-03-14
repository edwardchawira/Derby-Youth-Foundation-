# Fix 405 Error for list-equipment Function

## Problem Confirmed

- ✅ Function EXISTS as: `list-equipment` (without "vapi-")
- ❌ Returns **405 Method Not Allowed** when called with POST
- This means the function doesn't handle POST requests correctly

---

## Solution Options

### Option 1: Fix the Existing `list-equipment` Function (Quickest)

The function code needs to be updated in Supabase Dashboard:

1. Go to **Supabase Dashboard** → Edge Functions → `list-equipment`
2. Replace ALL the code with the code from: `supabase/functions/vapi-list-equipment/index.ts`
3. Make sure the code has:
   - `serve(async (req) => { ... })` handler
   - OPTIONS handler for CORS
   - POST request handling
4. Save/Deploy

---

### Option 2: Deploy as `vapi-list-equipment` (Recommended)

1. Go to **Supabase Dashboard** → Edge Functions
2. Click **"New Function"** or **"Create Function"**
3. **Name:** `vapi-list-equipment`
4. **Copy code from:** `supabase/functions/vapi-list-equipment/index.ts`
5. **Paste and deploy**
6. **Update Vapi URL to:** `.../functions/v1/vapi-list-equipment`

---

## For Now - Use `list-equipment` in Vapi

**Until you fix the 405 error, configure Vapi to use:**

- **Server URL:** `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/list-equipment`

**Then fix the function code** to handle POST properly.

---

## Verify Function Code Has This Structure

The function MUST start with:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // THIS IS CRITICAL - handles CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Your function code here
    // Must handle POST requests
  } catch (error) {
    // Error handling
  }
});
```

---

## Next Steps

1. **Check current function code** in Supabase Dashboard → `list-equipment`
2. **Compare with** `supabase/functions/vapi-list-equipment/index.ts`
3. **Update the deployed function** to match the correct code
4. **Test again** - should get 200 OK instead of 405

---

## Quick Test After Fix

Once you update the function code:

```powershell
Invoke-RestMethod -Uri "https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/list-equipment" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk"
    "Content-Type" = "application/json"
  } `
  -Body '{}'
```

**Should return JSON (not 405)!**
