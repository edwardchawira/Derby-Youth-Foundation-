# Fix 405 Error - Vapi Edge Function Issue

## Problem Identified

Your logs show:
- **Status:** 405 Method Not Allowed
- **URL Called:** `/functions/v1/list-equipment` ❌ (WRONG - missing "vapi-" prefix)
- **Should Be:** `/functions/v1/vapi-list-equipment` ✅

## Issues Found

### Issue 1: Wrong Function Name in URL

**What happened:**
- Vapi is calling: `https://...supabase.co/functions/v1/list-equipment`
- Should call: `https://...supabase.co/functions/v1/vapi-list-equipment`

**Solution:**
- Check Vapi tool configuration - Server URL must include `vapi-list-equipment` (not `list-equipment`)
- Or deploy the function with name `list-equipment` if that's what Vapi expects

### Issue 2: 405 Method Not Allowed

This usually means:
- Function exists but doesn't handle POST method correctly
- CORS preflight (OPTIONS) might not be handled

**Check the function handles OPTIONS:**

The function should have this at the start:
```typescript
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  // ... rest of code
});
```

---

## Fix Steps

### Step 1: Check Function Name

**Option A: Fix Vapi Configuration (Recommended)**

In Vapi Dashboard → Your Assistant → Tools → `listEquipment`:

**Server URL should be:**
```
https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-list-equipment
```

**NOT:**
```
https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/list-equipment
```

---

**Option B: Deploy Function with Correct Name**

If Vapi is calling `list-equipment`, you can:

1. Deploy a function named `list-equipment` (without "vapi-" prefix)
2. Use the same code as `vapi-list-equipment`

---

### Step 2: Verify Function Handles OPTIONS

Make sure your function code has:

```typescript
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Your function code here
  } catch (error) {
    // Error handling
  }
});
```

---

### Step 3: Check All Tool URLs in Vapi

Verify ALL tools have the correct URL format:

- ✅ `vapi-check-availability`
- ✅ `vapi-create-booking`
- ✅ `vapi-get-available-slots`
- ✅ `vapi-list-bookings`
- ✅ `vapi-list-equipment` (NOT `list-equipment`)
- ✅ `vapi-update-booking`
- ✅ `vapi-get-pricing`

All should have the `vapi-` prefix in the URL!

---

## Quick Fix

**In Vapi Dashboard:**

1. Go to Your Assistant → Tools
2. Find the `listEquipment` tool
3. Check **Server URL** field
4. If it says: `.../functions/v1/list-equipment`
5. Change it to: `.../functions/v1/vapi-list-equipment`
6. Save

---

## Test After Fix

After fixing the URL, test again:

```powershell
Invoke-RestMethod -Uri "https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-list-equipment" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk"
    "Content-Type" = "application/json"
  } `
  -Body '{}'
```

Should return JSON (not 405 error).

---

## Summary

**Root Cause:** Vapi is calling `/functions/v1/list-equipment` but the function is deployed as `/functions/v1/vapi-list-equipment`

**Fix:** Update Vapi tool Server URL to include `vapi-` prefix, OR deploy function without `vapi-` prefix

**All tool URLs should follow this pattern:**
```
https://[PROJECT-REF].supabase.co/functions/v1/vapi-[function-name]
```
