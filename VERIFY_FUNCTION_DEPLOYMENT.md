# Verify Edge Function Deployment

Your function might be deployed with a different name than expected. Let's verify what's actually deployed.

---

## Step 1: Check What Functions Are Actually Deployed

### In Supabase Dashboard:

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click **Edge Functions** (left sidebar)
4. **List all functions** that appear

**What to look for:**
- Is there a function named `vapi-list-equipment`? ✅
- Is there a function named `list-equipment` (without "vapi-")? ⚠️
- What are the EXACT names of all deployed functions?

---

## Step 2: Match Vapi Configuration to Actual Function Names

The Server URL in Vapi **MUST** match the **exact function name** as deployed in Supabase.

**Example:**
- If function is deployed as: `list-equipment`
- Vapi URL should be: `.../functions/v1/list-equipment`
- If function is deployed as: `vapi-list-equipment`
- Vapi URL should be: `.../functions/v1/vapi-list-equipment`

---

## Step 3: Check Both Scenarios

### Scenario A: Function is `list-equipment` (without "vapi-")

**Then in Vapi:**
- Server URL: `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/list-equipment`
- (NO "vapi-" prefix)

**But you said logs show this returns 405** - which means the function exists but might not handle POST correctly.

---

### Scenario B: Function is `vapi-list-equipment` (with "vapi-")

**Then in Vapi:**
- Server URL: `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-list-equipment`
- (WITH "vapi-" prefix)

**But you're getting 404** - which means the function doesn't exist with this name.

---

## Step 4: Solution - Ensure Names Match

**You have two options:**

### Option 1: Use Whatever Name Is Actually Deployed (Easiest)

1. Check Supabase Dashboard → Edge Functions
2. See what the function is ACTUALLY named
3. Use that EXACT name in Vapi Server URL

### Option 2: Redeploy with Correct Name

1. Delete the incorrectly named function from Supabase
2. Deploy it again with the name `vapi-list-equipment`
3. Then use that name in Vapi

---

## Step 5: Verify Function Code Handles POST

Even if the name matches, the 405 error suggests the function might not be handling POST correctly.

**Check in Supabase Dashboard:**
1. Open the function (`list-equipment` or `vapi-list-equipment`)
2. Check the code - does it have:

```typescript
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  // Handle POST requests here
  // ... rest of code
});
```

---

## Quick Diagnostic

**Run this to see what happens:**

1. **Check what's actually deployed:**
   - Supabase Dashboard → Edge Functions
   - List all function names

2. **Test the function that EXISTS:**
   ```powershell
   # Try WITHOUT "vapi-" prefix
   Invoke-RestMethod -Uri "https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/list-equipment" `
     -Method POST `
     -Headers @{
       "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk"
       "Content-Type" = "application/json"
     } `
     -Body '{}'
   ```

3. **Check the response:**
   - 404 = Function doesn't exist with that name
   - 405 = Function exists but doesn't handle POST
   - 200 = Function works!

---

## Most Likely Issue

Based on your logs showing Vapi called `/functions/v1/list-equipment` and got 405:

1. **Function IS deployed as `list-equipment`** (without "vapi-")
2. **But it's returning 405** = doesn't handle POST correctly
3. **When you test `vapi-list-equipment`** = 404 = doesn't exist

**Solution:**
- Either fix the function at `list-equipment` to handle POST correctly
- OR deploy a new function named `vapi-list-equipment` with correct code
- Make sure Vapi URL matches whichever function actually exists

---

**Next Step:** Check Supabase Dashboard → Edge Functions and tell me what function names you actually see deployed. This will help us match the Vapi configuration correctly!
