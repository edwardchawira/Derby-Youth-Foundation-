# Vapi Troubleshooting Guide

This guide helps diagnose and fix issues with Vapi voice agent not updating Supabase or accessing the equipment database.

## Quick Diagnostics

### 1. Test Database Connectivity

Call the diagnostic Edge Function:
```bash
curl -X POST https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-diagnostic \
  -H "Authorization: Bearer [YOUR-ANON-KEY]"
```

This will show:
- Environment variables status
- Database connection status
- Table access permissions
- Sample data availability

### 2. Check Supabase Edge Function Logs

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click on a function (e.g., `vapi-create-booking`)
3. Click **"Logs"** tab
4. Look for errors with ❌ or warnings with ⚠️

Common log patterns:
- `❌ Missing environment variables` → Environment variables not set
- `❌ Error creating studio booking` → Database permission issue
- `❌ Invalid date format` → Date format mismatch

## Common Issues and Fixes

### Issue 1: Vapi Not Updating Database

**Symptoms:**
- Bookings created via phone call don't appear in Supabase
- No error messages from Vapi
- Functions appear to succeed but no data saved

**Possible Causes:**

#### A. Missing Environment Variables

**Check:**
1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings**
2. Verify these are set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

**Fix:**
1. Get your Supabase URL: Dashboard → Settings → API → Project URL
2. Get your Service Role Key: Dashboard → Settings → API → `service_role` key (⚠️ Keep secret!)
3. Set in Edge Functions environment variables
4. Redeploy all Edge Functions

#### B. Row Level Security (RLS) Blocking Inserts

**Check:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_policies 
WHERE tablename = 'studio_bookings' 
AND policyname LIKE '%INSERT%' OR policyname LIKE '%CREATE%';
```

**Fix:**
The Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` which **bypasses RLS**, so this shouldn't be an issue. However, if inserts are still blocked:

1. Verify RLS is configured correctly for `studio_bookings`:
```sql
-- Allow service role to insert (should already work with service role key)
-- But verify the table structure is correct
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'studio_bookings';
```

2. Check for NOT NULL constraints that might be missing values:
```sql
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'studio_bookings' 
AND is_nullable = 'NO' AND column_default IS NULL;
```

#### C. Date Format Issues

**Symptoms:**
- Date validation errors in logs
- Bookings created with wrong dates

**Check logs for:**
```
❌ Invalid date format received: [date]
```

**Fix:**
- Ensure Vapi system prompt specifies DD-MM-YYYY format
- Verify date conversion in Edge Functions (check logs)
- Test with diagnostic function

#### D. Function Not Being Called

**Check:**
1. Vapi Dashboard → **Calls** → Select a call → **Logs**
2. Look for tool calls to `createBooking`
3. Check if the function URL is correct

**Verify Function URLs:**
- All functions should be: `https://[PROJECT-REF].supabase.co/functions/v1/vapi-[function-name]`
- Authorization header should be: `Bearer [YOUR-ANON-KEY]`

### Issue 2: No Access to Equipment Database

**Symptoms:**
- Vapi can't list available equipment
- Equipment queries fail

**Fix:**
1. **Add the new `listEquipment` tool to Vapi:**
   - Go to Vapi Dashboard → Your Assistant → Tools
   - Add new Server Function
   - Use `vapi-list-equipment` Edge Function
   - See `HOW_TO_ADD_SERVER_FUNCTIONS_IN_VAPI.md` for details

2. **Verify `equipment_items` table exists:**
```sql
SELECT COUNT(*) FROM equipment_items;
```

3. **Check RLS policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'equipment_items';
```

The `vapi-list-equipment` function uses service role key, so it should bypass RLS.

### Issue 3: Calendar Showing Wrong Year (2023 instead of 2026)

**Symptoms:**
- Vapi mentions dates in 2023 or 2024
- System prompt has outdated year examples

**Fix:**
1. **Update Vapi System Prompt:**
   - Copy the updated prompt from `VAPI_SYSTEM_PROMPT.md`
   - Paste into Vapi Dashboard → Your Assistant → System Message
   - Ensure it says "Current year is 2026"

2. **Update Tool Definitions:**
   - All tool definitions in `vapi-tool-definitions.json` are updated
   - Re-add tools in Vapi if needed (should auto-update)

3. **Test:**
   - Make a test call
   - Ask "What's today's date?" or "What year is it?"
   - Should respond with 2026

### Issue 4: Date Format Mismatches

**Symptoms:**
- Dates rejected with "Invalid date format"
- Bookings created but dates look wrong

**Check:**
- Edge Function logs show date conversion: `📅 Date conversion: [input] → [output]`
- Verify format is DD-MM-YYYY (e.g., `25-12-2026`)

**Fix:**
1. Ensure Vapi system prompt specifies DD-MM-YYYY
2. Ensure customer dates are converted to DD-MM-YYYY before calling tools
3. Check Edge Function logs for date conversion errors

## Step-by-Step Debugging Process

### Step 1: Verify Environment Variables

```bash
# Test diagnostic function
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/vapi-diagnostic \
  -H "Authorization: Bearer [ANON-KEY]" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "health": {
    "databaseConnected": true,
    "canAccessTables": true,
    "hasErrors": false
  }
}
```

### Step 2: Test Each Edge Function Manually

#### Test `vapi-create-booking`:
```bash
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/vapi-create-booking \
  -H "Authorization: Bearer [ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test Customer",
    "customer_email": "test@example.com",
    "booking_date": "25-12-2026",
    "booking_time": "14:00",
    "session_hours": 2,
    "booking_type": "studio"
  }'
```

Check response and Supabase logs.

#### Test `vapi-list-equipment`:
```bash
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/vapi-list-equipment \
  -H "Authorization: Bearer [ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Should return list of equipment items.

### Step 3: Check Vapi Call Logs

1. Make a test phone call
2. Go to Vapi Dashboard → **Calls**
3. Click on the call → **Logs**
4. Look for:
   - Tool calls made
   - Tool responses
   - Errors

### Step 4: Verify Database Inserts

After a test booking:
```sql
-- Check if booking was created
SELECT * FROM studio_bookings 
ORDER BY created_at DESC 
LIMIT 5;
```

If no booking appears:
1. Check Edge Function logs for errors
2. Verify environment variables
3. Check RLS policies (though service role should bypass)

## Environment Variables Checklist

Ensure these are set in **Supabase Dashboard → Edge Functions → Settings**:

- ✅ `SUPABASE_URL` = `https://[PROJECT-REF].supabase.co`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...` (service_role key from API settings)

To find your keys:
1. Supabase Dashboard → Settings → API
2. Project URL → Copy to `SUPABASE_URL`
3. Service Role Key (under "Project API keys") → Copy to `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Warning:** Service Role Key bypasses RLS. Keep it secret!

## RLS Policy Verification

Even though service role bypasses RLS, verify policies exist:

```sql
-- Check studio_bookings policies
SELECT * FROM pg_policies WHERE tablename = 'studio_bookings';

-- Check equipment_items policies  
SELECT * FROM pg_policies WHERE tablename = 'equipment_items';

-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('studio_bookings', 'bookings', 'equipment_items');
```

## Next Steps After Fixing

1. ✅ Deploy updated Edge Functions:
   ```bash
   supabase functions deploy vapi-create-booking
   supabase functions deploy vapi-list-equipment
   supabase functions deploy vapi-diagnostic
   # ... deploy all other vapi-* functions
   ```

2. ✅ Update Vapi tools:
   - Re-add `listEquipment` tool if not already added
   - Verify all tool URLs point to correct Edge Functions

3. ✅ Update System Prompt:
   - Copy from `VAPI_SYSTEM_PROMPT.md`
   - Paste into Vapi Assistant settings

4. ✅ Test with phone call:
   - Create a booking
   - List equipment
   - Check availability
   - Verify data appears in Supabase

## Getting Help

If issues persist:

1. **Check Supabase Edge Function Logs:**
   - Look for ❌ errors
   - Share error messages for debugging

2. **Check Vapi Call Logs:**
   - Look for tool call failures
   - Share relevant log entries

3. **Run Diagnostic Function:**
   - Share the JSON response
   - This shows database connectivity status

4. **Verify:**
   - Environment variables are set correctly
   - Edge Functions are deployed
   - Vapi tools are configured correctly
   - Phone number is assigned to assistant

---

**Last Updated:** 2026-01-XX
**Current Year:** 2026
