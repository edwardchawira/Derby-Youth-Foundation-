# How to Test Edge Functions

Quick guide on where and how to test your Supabase Edge Functions.

---

## Option 1: Test in Terminal (Recommended)

Open **PowerShell** or **Command Prompt** in your project directory, then run these commands:

### Test `vapi-list-equipment`:

**Option A: Using Invoke-RestMethod (Recommended for PowerShell):**
```powershell
Invoke-RestMethod -Uri "https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-list-equipment" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk"
    "Content-Type" = "application/json"
  } `
  -Body '{}'
```

**Option B: Using curl.exe (if you have curl installed):**
```powershell
curl.exe -X POST https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-list-equipment `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk" `
  -H "Content-Type: application/json" `
  -d '{}'
```

**Note:** In PowerShell, `curl` is an alias for `Invoke-WebRequest`. Use `Invoke-RestMethod` (Option A) or `curl.exe` (Option B).

### Test `vapi-get-pricing`:

```powershell
Invoke-RestMethod -Uri "https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-get-pricing" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk"
    "Content-Type" = "application/json"
  } `
  -Body '{}'
```

### Test `vapi-check-availability`:

```powershell
Invoke-RestMethod -Uri "https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-check-availability" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk"
    "Content-Type" = "application/json"
  } `
  -Body '{"booking_date": "25-12-2026", "booking_type": "studio"}'
```

---

## Option 2: Test in Supabase Dashboard

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions** (left sidebar)
4. Click on a function (e.g., `vapi-list-equipment`)
5. Click **"Invoke"** tab
6. Fill in:
   - **HTTP Method:** POST
   - **Request Body:** `{}` (empty JSON object)
7. Click **"Invoke Function"**
8. Check the response

---

## Option 3: Check Logs in Supabase Dashboard

After testing (either via terminal or Vapi call):

1. Go to **Supabase Dashboard** → Your Project
2. Click **Edge Functions** (left sidebar)
3. Click on the function name (e.g., `vapi-list-equipment`)
4. Click **"Logs"** tab
5. You should see logs with:
   - `🔍 Function called`
   - `📥 Request params`
   - `✅ Success` or `❌ Error`

---

## Option 4: Use Postman or Insomnia

1. **Create a new POST request**
2. **URL:** `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-list-equipment`
3. **Headers:**
   - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk`
   - `Content-Type`: `application/json`
4. **Body (raw JSON):** `{}`
5. Click **Send**

---

## What to Expect

### Success Response:
```json
{
  "success": true,
  "equipment": [...],
  "count": 5
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## After Testing

1. **Check Supabase Logs:**
   - Dashboard → Edge Functions → Function Name → Logs
   - Should show execution logs

2. **Check Response:**
   - Status code should be 200 (OK)
   - Response should contain data or error message

3. **If Test Works But Vapi Doesn't:**
   - Problem is in Vapi tool configuration
   - Check Server URL, Authorization header, HTTP method

---

## Quick Test Script

Save this as `test-functions.ps1` and run it:

```powershell
$PROJECT_REF = "dxfukbncszjdwyqhmrgq"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk"

Write-Host "Testing vapi-list-equipment..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "https://${PROJECT_REF}.supabase.co/functions/v1/vapi-list-equipment" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer ${ANON_KEY}"
    "Content-Type" = "application/json"
  } `
  -Body '{}'

Write-Host "`nTesting vapi-get-pricing..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "https://${PROJECT_REF}.supabase.co/functions/v1/vapi-get-pricing" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer ${ANON_KEY}"
    "Content-Type" = "application/json"
  } `
  -Body '{}'
```

---

## Troubleshooting

### "curl not recognized"
- Install curl or use PowerShell's `Invoke-WebRequest`
- Or use the Supabase Dashboard "Invoke" tab

### "404 Not Found"
- Function not deployed
- Wrong URL (check function name matches)

### "401 Unauthorized"
- Wrong Authorization header
- Missing or incorrect Bearer token

### No logs appear
- Function wasn't called
- Check if you tested the right function
- Wait a few seconds for logs to appear

---

**Start with Option 1 (Terminal) - it's the quickest way to test!** 🚀
