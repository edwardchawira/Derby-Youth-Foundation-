# ✅ Vapi HTTP Method Confirmation

## **ALL Vapi Tools MUST Use POST Method**

### Confirmed ✅

**Every single Vapi tool server function MUST be configured with:**

- **Request HTTP Method:** `POST`
- **NOT GET** ❌
- **NOT PUT** ❌  
- **NOT PATCH** ❌
- **POST ONLY** ✅

---

## Why POST?

1. **Edge Functions read request body:**
   - All functions use `await req.json()` which requires a request body
   - POST is the standard method for sending JSON data

2. **Tool parameters sent in body:**
   - Tool parameters are sent in the request body as JSON
   - POST allows sending data in the body

3. **CORS preflight:**
   - Functions handle `OPTIONS` for preflight, then expect `POST` with data

---

## Configuration in Vapi Dashboard

For **EVERY** tool you configure:

1. Go to Vapi Dashboard → Your Assistant → Tools
2. Select or create a tool
3. Find **"Request HTTP Method"** or **"Method"** field
4. Select: **POST** ✅
5. Save

---

## Quick Verification

**Check each tool:**
- ✅ listEquipment → Method: POST
- ✅ checkAvailability → Method: POST
- ✅ createBooking → Method: POST
- ✅ getAvailableSlots → Method: POST
- ✅ listBookings → Method: POST
- ✅ updateBooking → Method: POST

---

## If Tools Still Don't Work

Even with POST method, check:

1. **Authorization Header:**
   - Name: `Authorization`
   - Value: `Bearer [YOUR-SUPABASE-ANON-KEY]`

2. **Server URL:**
   - Format: `https://[PROJECT-REF].supabase.co/functions/v1/vapi-[name]`
   - Must include `/functions/v1/`

3. **Content-Type:**
   - Should be `application/json`

4. **Function Deployment:**
   - Verify functions are deployed: `supabase functions list`

5. **Environment Variables:**
   - `SUPABASE_URL` must be set
   - `SUPABASE_SERVICE_ROLE_KEY` must be set

---

**Bottom Line: POST is required for ALL tools. ✅**
