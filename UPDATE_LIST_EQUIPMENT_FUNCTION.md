# Update list-equipment Function to Support POST

## Problem

The deployed `list-equipment` function **only handles GET requests**, but **Vapi requires POST**. That's why you're getting `405 Method Not Allowed`.

---

## Solution: Update Function Code

**Replace ALL the code in Supabase Dashboard** with the corrected version that supports both GET and POST.

---

## Step-by-Step Instructions

### 1. Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Edge Functions** (left sidebar)
4. Click on **`list-equipment`** function

### 2. Replace the Code

1. **Select ALL existing code** (Ctrl+A / Cmd+A)
2. **Delete it**
3. **Copy the corrected code** from: `supabase/functions/vapi-list-equipment/index-FIXED.ts`
4. **Paste it** into the Supabase editor
5. **Click "Deploy"** or "Save"

---

## What Changed?

✅ **Supports POST** (Vapi) and GET (backwards compatibility)
✅ **Reads from JSON body** when POST is used
✅ **Uses SERVICE_ROLE_KEY** (bypasses RLS for Vapi)
✅ **Adds CORS headers** (required for Vapi)
✅ **Handles both table structures** (`equipment_items` or `equipment`)
✅ **Better error logging** (check Supabase logs)

---

## Test After Update

Run this PowerShell command:

```powershell
Invoke-RestMethod -Uri "https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/list-equipment" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk"
    "Content-Type" = "application/json"
  } `
  -Body '{}'
```

**Expected Result:** JSON response with equipment data (not 405 error!)

---

## Vapi Configuration

Once the function works, configure Vapi with:

- **Server URL:** `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/list-equipment`
- **Method:** `POST`
- **Authorization:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your anon key)

---

## Verify Environment Variables

Make sure these are set in Supabase Dashboard → Edge Functions → Settings → Secrets:

- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (preferred) or `SUPABASE_ANON_KEY`

---

## After Update

Check Supabase logs:
- **Supabase Dashboard** → Edge Functions → `list-equipment` → **Logs**
- You should see: `🔍 Equipment list requested: { method: "POST", params: ... }`

If you see logs, the function is being called correctly! ✅
