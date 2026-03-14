# Vapi No Logs Diagnostic Guide

If you see **NO logs at all** in Supabase Edge Functions, it means the functions **aren't being called**. This is a configuration issue, not a function issue.

---

## Step 1: Verify Functions Are Deployed

**Check if functions exist:**
```bash
supabase functions list
```

**Expected output should show:**
- `vapi-check-availability`
- `vapi-create-booking`
- `vapi-get-available-slots`
- `vapi-list-bookings`
- `vapi-list-equipment`
- `vapi-update-booking`
- `vapi-get-pricing`

**If missing, deploy them:**
```bash
supabase functions deploy vapi-check-availability
supabase functions deploy vapi-create-booking
supabase functions deploy vapi-get-available-slots
supabase functions deploy vapi-list-bookings
supabase functions deploy vapi-list-equipment
supabase functions deploy vapi-update-booking
supabase functions deploy vapi-get-pricing
```

---

## Step 2: Test Functions Manually

Test ONE function directly to verify it works:

```bash
# Replace with your actual values
PROJECT_REF="dxfukbncszjdwyqhmrgq"
ANON_KEY="your-anon-key-here"

# Test listEquipment
curl -X POST https://${PROJECT_REF}.supabase.co/functions/v1/vapi-list-equipment \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected:**
- Status 200 OK
- JSON response with equipment list
- **Logs should appear in Supabase Dashboard** → Edge Functions → `vapi-list-equipment` → Logs

**If this works but Vapi doesn't call it:**
- Problem is in Vapi tool configuration, not the function

**If this doesn't work:**
- Function deployment issue
- Environment variables missing
- Check Supabase Edge Function logs for errors

---

## Step 3: Verify Vapi Tool Configuration

### Check 1: Tool Names Must Match Exactly

In Vapi Dashboard → Your Assistant → Tools:

- Function name in Vapi: `listEquipment` (exact case)
- Function name in URL should match: `vapi-list-equipment`

**Common mistakes:**
- ❌ `list_equipment` (wrong - uses underscore)
- ❌ `ListEquipment` (wrong - wrong case)
- ✅ `listEquipment` (correct)

---

### Check 2: Server URL Format

**Correct format:**
```
https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-list-equipment
```

**Breakdown:**
- `https://` - Must be HTTPS
- `dxfukbncszjdwyqhmrgq` - Your project reference
- `.supabase.co/functions/v1/` - Fixed path (MUST include this)
- `vapi-list-equipment` - Function name (matches deployed function)

**Common mistakes:**
- ❌ Missing `/functions/v1/` → `https://...supabase.co/vapi-list-equipment`
- ❌ Wrong project reference
- ❌ HTTP instead of HTTPS
- ❌ Extra trailing slash: `...vapi-list-equipment/`

---

### Check 3: HTTP Method Must Be POST

**In Vapi tool configuration:**
- Request HTTP Method: **POST** ✅
- NOT GET ❌
- NOT PUT ❌

---

### Check 4: Authorization Header

**Must be exactly:**
- Header Name: `Authorization`
- Header Value: `Bearer [YOUR-ANON-KEY]`

**Important:**
- Must include space after "Bearer"
- Must use `anon` key, NOT `service_role` key
- Get key from: Supabase Dashboard → Settings → API → `anon` `public` key

**Your anon key should be:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk
```

So the header value should be:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImD4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk
```

---

### Check 5: Tool Is Added to Assistant

1. Go to Vapi Dashboard → Your Assistant
2. Click **"Tools"** tab
3. Verify all tools are listed:
   - `checkAvailability`
   - `getAvailableSlots`
   - `createBooking`
   - `listBookings`
   - `listEquipment`
   - `updateBooking`
   - `getPricing`

**If tools are missing:**
- Add them using the configuration guides

---

### Check 6: Assistant Is Assigned to Phone Number

1. Go to Vapi Dashboard → Phone Numbers
2. Click on your phone number
3. Verify **"Assistant"** field shows your assistant name
4. If empty or wrong, select your assistant and **Save**

**Without this, calls won't use the tools!**

---

## Step 4: Check Vapi Call Logs

When you make a test call:

1. Go to Vapi Dashboard → **Calls**
2. Click on your test call
3. Click **"Logs"** tab
4. Look for:
   - **Tool calls made** - Should see tool names like `listEquipment`, etc.
   - **HTTP requests** - Should show POST requests to your Supabase URLs
   - **Status codes** - Should be 200 (success) or error codes
   - **Error messages** - If tools are called but fail

**What to look for:**

### If you see tool calls but errors:
- Tool is configured correctly
- Problem is in the function or authorization
- Check the error message in Vapi logs

### If you see NO tool calls at all:
- Assistant isn't calling tools
- Check tool descriptions match user questions
- Check system prompt instructs assistant to use tools

### If you see 404 errors:
- Server URL is wrong
- Function not deployed
- Check URL format

### If you see 401 errors:
- Authorization header wrong
- Wrong API key
- Check Bearer token format

---

## Step 5: Verify System Prompt

Your Vapi system prompt should instruct the assistant to **use tools**:

**Good system prompt includes:**
- "Use the `listEquipment` tool when customers ask about equipment"
- "Use the `getPricing` tool when customers ask about prices"
- "Always check availability before creating bookings"

**If system prompt doesn't mention tools:**
- Assistant might not know to use them
- Update system prompt to explicitly mention tool usage

---

## Step 6: Test With Simple Request

Make a test call and ask something simple that should trigger a tool:

**Test 1 - Equipment:**
```
"What equipment do you have?"
```
**Should trigger:** `listEquipment` tool

**Test 2 - Pricing:**
```
"What are your studio prices?"
```
**Should trigger:** `getPricing` tool

**Test 3 - Availability:**
```
"Is December 25th available?"
```
**Should trigger:** `checkAvailability` or `getAvailableSlots` tool

---

## Step 7: Enable Detailed Logging

In Vapi Dashboard → Your Assistant → Settings:
- Enable "Debug Mode" or "Verbose Logging" if available
- This shows more detailed logs

---

## Quick Checklist

Before testing, verify:

- [ ] All Edge Functions are deployed (`supabase functions list`)
- [ ] Functions work when tested with curl
- [ ] All tools are added to Vapi Assistant
- [ ] Server URLs are correct (with `/functions/v1/`)
- [ ] All tools use POST method
- [ ] Authorization header is set: `Bearer [ANON-KEY]`
- [ ] Assistant is assigned to phone number
- [ ] System prompt mentions using tools
- [ ] Request Body Schemas match tool definitions

---

## Common Issues & Solutions

### Issue 1: Functions Deployed But Not Called

**Cause:** Tool configuration in Vapi is wrong

**Solution:**
1. Double-check Server URL format
2. Verify Authorization header
3. Confirm tool name matches exactly
4. Make sure assistant is assigned to phone number

---

### Issue 2: 404 Not Found in Vapi Logs

**Cause:** Wrong Server URL or function not deployed

**Solution:**
1. Verify function exists: `supabase functions list`
2. Check URL matches deployed function name
3. Ensure `/functions/v1/` is in the path

---

### Issue 3: 401 Unauthorized in Vapi Logs

**Cause:** Wrong Authorization header

**Solution:**
1. Verify header name is exactly `Authorization`
2. Verify header value is `Bearer [ANON-KEY]` (with space)
3. Use the `anon` key, not `service_role` key

---

### Issue 4: Tools Exist But Assistant Doesn't Use Them

**Cause:** System prompt doesn't instruct tool usage OR tool descriptions don't match queries

**Solution:**
1. Update system prompt to explicitly mention tools
2. Review tool descriptions - they should match customer questions
3. Make test queries match tool descriptions exactly

---

## Manual Verification Script

Run this to verify everything is set up correctly:

```bash
# Set your values
PROJECT_REF="dxfukbncszjdwyqhmrgq"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk"

echo "Testing vapi-list-equipment..."
curl -v -X POST https://${PROJECT_REF}.supabase.co/functions/v1/vapi-list-equipment \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}'

echo -e "\n\nTesting vapi-get-pricing..."
curl -v -X POST https://${PROJECT_REF}.supabase.co/functions/v1/vapi-get-pricing \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**If these work:**
- Functions are deployed correctly
- URLs are correct
- Authorization works
- **Problem is in Vapi tool configuration**

**If these fail:**
- Check error messages
- Check Supabase Edge Function logs
- Verify environment variables are set in Supabase

---

## Next Steps

1. **Run the manual verification script above**
2. **Check Vapi call logs** for any HTTP requests (even failed ones)
3. **Verify all tools are configured** using the checklist above
4. **Share with me:**
   - Screenshot of Vapi tool configuration (blur sensitive keys)
   - Vapi call logs from a test call
   - Results of manual curl test

This will help pinpoint the exact issue!
