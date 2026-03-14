# Vapi Backend Access Diagnostic Guide

## ✅ Confirmation: HTTP Method is POST

**YES, all Vapi tools MUST use POST method.** This is confirmed because:
- All Edge Functions use `await req.json()` which requires a request body
- POST is the standard method for sending JSON data to APIs
- All functions handle `OPTIONS` for CORS preflight, then expect POST with JSON body

---

## Critical Configuration Checklist

### 1. **HTTP Method: POST** ✅ (Required for all tools)

For every Vapi tool, ensure:
- **Request HTTP Method:** `POST`

---

### 2. **Server URL Format** (Critical!)

**Correct format:**
```
https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-[function-name]
```

**Example:**
```
https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-list-equipment
```

**Common mistakes:**
- ❌ Missing `/functions/v1/` in the path
- ❌ Wrong project reference
- ❌ Using HTTP instead of HTTPS
- ❌ Extra trailing slashes

---

### 3. **Authorization Header** (Critical!)

**Required for ALL tools:**

- **Header Name:** `Authorization`
- **Header Value:** `Bearer [YOUR-SUPABASE-ANON-KEY]`

**Where to get the key:**
1. Supabase Dashboard → Settings → API
2. Copy the `anon` `public` key (NOT the service_role key)

**Important:** 
- Must start with `Bearer ` (note the space after "Bearer")
- Must use the `anon` key, NOT the `service_role` key for Edge Function calls

---

### 4. **Content-Type Header** (Usually Auto-Set)

Vapi should automatically set:
- **Header Name:** `Content-Type`
- **Header Value:** `application/json`

If not, add it manually.

---

## Tool-by-Tool Configuration

### Tool 1: `listEquipment`

**Function Name:**
```
listEquipment
```

**Server URL:**
```
https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-list-equipment
```

**Method:** `POST`

**Headers:**
- `Authorization`: `Bearer [YOUR-ANON-KEY]`
- `Content-Type`: `application/json`

**Request Body Schema:** (3 properties, all optional)
- `category` (string, optional)
- `search` (string, optional)  
- `available_only` (boolean, optional, default: true)

---

### Tool 2: `checkAvailability`

**Function Name:**
```
checkAvailability
```

**Server URL:**
```
https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-check-availability
```

**Method:** `POST`

**Headers:**
- `Authorization`: `Bearer [YOUR-ANON-KEY]`
- `Content-Type`: `application/json`

---

### Tool 3: `createBooking`

**Function Name:**
```
createBooking
```

**Server URL:**
```
https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-create-booking
```

**Method:** `POST`

**Headers:**
- `Authorization`: `Bearer [YOUR-ANON-KEY]`
- `Content-Type`: `application/json`

---

### Tool 4: `getAvailableSlots`

**Function Name:**
```
getAvailableSlots
```

**Server URL:**
```
https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-get-available-slots
```

**Method:** `POST`

**Headers:**
- `Authorization`: `Bearer [YOUR-ANON-KEY]`
- `Content-Type`: `application/json`

---

### Tool 5: `listBookings`

**Function Name:**
```
listBookings
```

**Server URL:**
```
https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-list-bookings
```

**Method:** `POST`

**Headers:**
- `Authorization`: `Bearer [YOUR-ANON-KEY]`
- `Content-Type`: `application/json`

---

### Tool 6: `updateBooking`

**Function Name:**
```
updateBooking
```

**Server URL:**
```
https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-update-booking
```

**Method:** `POST`

**Headers:**
- `Authorization`: `Bearer [YOUR-ANON-KEY]`
- `Content-Type`: `application/json`

---

## Step-by-Step Troubleshooting

### Issue: "Technical difficulties" when listing equipment

**Step 1: Test Edge Function Directly**

```bash
curl -X POST https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-list-equipment \
  -H "Authorization: Bearer [YOUR-ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": true,
  "equipment": [...],
  "count": 5
}
```

**If this fails:**
- Check Edge Function is deployed
- Check environment variables are set
- Check Supabase Edge Function logs

---

### Issue: Tools not working / No backend access

**Step 1: Verify Tool Configuration in Vapi**

For each tool in Vapi Dashboard:
1. ✅ Method is `POST`
2. ✅ Server URL is correct (with `/functions/v1/`)
3. ✅ Authorization header is set: `Bearer [ANON-KEY]`
4. ✅ Request Body Schema matches tool definition

**Step 2: Check Vapi Call Logs**

1. Make a test call
2. Go to Vapi Dashboard → Calls → Select call → Logs
3. Look for:
   - Tool calls made (should see `listEquipment`, etc.)
   - HTTP status codes (200 = success, 4xx/5xx = error)
   - Response from functions
   - Error messages

**Step 3: Check Supabase Edge Function Logs**

1. Supabase Dashboard → Edge Functions → Select function → Logs
2. Look for:
   - `🔍 Function called` - Function is being invoked
   - `📥 Request body` - Shows incoming data
   - `❌ Error` - Shows what went wrong
   - `✅ Success` - Shows successful execution

---

### Issue: Inaccurate studio session prices

**Problem:** Vapi is giving wrong prices (not from database)

**Solution:** 
- Vapi doesn't have access to pricing data
- The tools don't include pricing queries
- Prices need to be:
  1. Added to system prompt as static info, OR
  2. Created a new tool to query pricing from database

**Quick Fix - Add Pricing to System Prompt:**

Add to your Vapi system prompt:

```
## Studio Session Pricing

- Rehearsal Space: £X per hour
- Recording Studio: £X per hour
- Four-hour packages: £X
- Eight-hour packages: £X

[Add your actual prices here]
```

**Better Fix - Create Pricing Tool:**

We can create a `vapi-get-pricing` Edge Function that queries the `studio_services` table for accurate pricing. Would you like me to create this?

---

## Testing Each Tool Manually

### Test 1: listEquipment

```bash
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/vapi-list-equipment \
  -H "Authorization: Bearer [ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test 2: checkAvailability

```bash
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/vapi-check-availability \
  -H "Authorization: Bearer [ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_date": "25-12-2026",
    "booking_time": "14:00",
    "session_hours": 2,
    "booking_type": "studio"
  }'
```

### Test 3: getAvailableSlots

```bash
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/vapi-get-available-slots \
  -H "Authorization: Bearer [ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_date": "25-12-2026",
    "booking_type": "studio"
  }'
```

---

## Common Configuration Errors

### Error 1: "404 Not Found"

**Cause:** Wrong Server URL or function not deployed

**Fix:**
- Verify function name in URL matches deployed function
- Check function is deployed: `supabase functions list`
- Redeploy: `supabase functions deploy vapi-list-equipment`

---

### Error 2: "401 Unauthorized"

**Cause:** Missing or wrong Authorization header

**Fix:**
- Verify header name is exactly `Authorization`
- Verify header value is `Bearer [ANON-KEY]` (with space after "Bearer")
- Verify you're using the `anon` key, not `service_role` key

---

### Error 3: "500 Internal Server Error"

**Cause:** Edge Function error (missing env vars, database error, etc.)

**Fix:**
- Check Supabase Edge Function logs
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Check database tables exist and have data

---

### Error 4: Tool called but no response / "Technical difficulties"

**Cause:** Function called but returned error, or response format not understood

**Fix:**
1. Check Vapi call logs - what did the function return?
2. Check Supabase Edge Function logs - did it execute successfully?
3. Verify response format matches what Vapi expects

---

## Verification Checklist

Before testing, verify:

- [ ] All Edge Functions are deployed
- [ ] All functions have environment variables set (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] All tools in Vapi use `POST` method
- [ ] All Server URLs are correct (with `/functions/v1/`)
- [ ] All Authorization headers are set (`Bearer [ANON-KEY]`)
- [ ] Request Body Schemas match tool definitions
- [ ] Function names in Vapi match exactly (case-sensitive)
- [ ] Assistant is assigned to the phone number
- [ ] Phone number is saved and active

---

## Quick Diagnostic Command

Run this to test all functions at once:

```bash
# Replace [PROJECT-REF] and [ANON-KEY] with your values

PROJECT_REF="your-project-ref"
ANON_KEY="your-anon-key"

# Test listEquipment
echo "Testing listEquipment..."
curl -X POST https://${PROJECT_REF}.supabase.co/functions/v1/vapi-list-equipment \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test checkAvailability
echo -e "\n\nTesting checkAvailability..."
curl -X POST https://${PROJECT_REF}.supabase.co/functions/v1/vapi-check-availability \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"booking_date": "25-12-2026", "booking_type": "studio"}'
```

---

## Next Steps

1. **Verify all tools use POST method** ✅
2. **Test each function manually** with curl commands above
3. **Check Vapi call logs** when making phone calls
4. **Check Supabase Edge Function logs** for errors
5. **Verify Authorization headers** are correct
6. **Verify Server URLs** are correct

If tools still don't work after verifying all above, share:
- Vapi call logs (from a test call)
- Supabase Edge Function logs
- Any error messages you see

This will help pinpoint the exact issue.
