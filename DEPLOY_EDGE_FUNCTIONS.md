# How to Deploy Edge Functions

Your Edge Functions need to be deployed before they can be called. Here are two ways to deploy them.

---

## Option 1: Deploy via Supabase Dashboard (Easiest)

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project

### Step 2: Create/Deploy Each Function

For each function, repeat these steps:

#### For `vapi-list-equipment`:
1. Go to **Edge Functions** (left sidebar)
2. Click **"New Function"** or **"Create Function"**
3. **Function Name:** `vapi-list-equipment`
4. **Copy the code** from: `supabase/functions/vapi-list-equipment/index.ts`
5. **Paste it** into the code editor
6. Click **"Deploy"** or **"Save"**

#### Repeat for all functions:
- `vapi-check-availability`
- `vapi-create-booking`
- `vapi-get-available-slots`
- `vapi-list-bookings`
- `vapi-list-equipment`
- `vapi-update-booking`
- `vapi-get-pricing`
- `vapi-diagnostic` (optional - for testing)

### Step 3: Set Environment Variables

After deploying, for EACH function:

1. Click on the function name
2. Go to **"Settings"** tab
3. Add these **Secrets/Environment Variables**:

   - **Name:** `SUPABASE_URL`
   - **Value:** `https://dxfukbncszjdwyqhmrgq.supabase.co`

   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Get from **Settings → API → service_role key** (⚠️ Keep secret!)

4. Click **"Save"** or **"Update"**

---

## Option 2: Deploy via Supabase CLI

### Step 1: Install Supabase CLI

```powershell
npm install -g supabase
```

Or use Scoop (Windows package manager):
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 2: Login to Supabase

```powershell
supabase login
```

This will open a browser to authenticate.

### Step 3: Link Your Project

```powershell
supabase link --project-ref dxfukbncszjdwyqhmrgq
```

### Step 4: Deploy All Functions

```powershell
# Deploy all at once
supabase functions deploy

# Or deploy individually
supabase functions deploy vapi-list-equipment
supabase functions deploy vapi-check-availability
supabase functions deploy vapi-create-booking
supabase functions deploy vapi-get-available-slots
supabase functions deploy vapi-list-bookings
supabase functions deploy vapi-update-booking
supabase functions deploy vapi-get-pricing
supabase functions deploy vapi-diagnostic
```

### Step 5: Set Environment Variables

After deploying, set environment variables for all functions:

```powershell
# Set SUPABASE_URL (same for all functions)
supabase secrets set SUPABASE_URL=https://dxfukbncszjdwyqhmrgq.supabase.co

# Set SUPABASE_SERVICE_ROLE_KEY (get from Dashboard → Settings → API)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Or set them in Dashboard → Edge Functions → Settings → Secrets.

---

## Verify Deployment

After deploying, test again:

```powershell
Invoke-RestMethod -Uri "https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-list-equipment" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk"
    "Content-Type" = "application/json"
  } `
  -Body '{}'
```

**Expected:** Should return JSON with equipment list (not 404 error)

---

## Checklist

- [ ] All functions are deployed (check Dashboard → Edge Functions)
- [ ] Environment variables are set (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Functions can be tested successfully
- [ ] Logs appear when functions are called

---

## Troubleshooting

### "404 Not Found" after deployment
- Check function name matches exactly (case-sensitive)
- Verify deployment was successful
- Check function exists in Dashboard → Edge Functions

### "500 Internal Server Error"
- Check environment variables are set
- Check Supabase Edge Function logs for details
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct

### Functions deployed but no logs
- Check you're testing the correct function name
- Wait a few seconds - logs may take time to appear
- Check you're using the correct project

---

**Once deployed, test again and the 404 error should be gone!** ✅
