# Vapi Tool Configuration Checklist

Quick reference for configuring all Vapi tools correctly.

## ✅ Confirmed: ALL Tools Must Use POST Method

Every Vapi tool server function **MUST** use **POST** as the HTTP method.

---

## Standard Configuration for ALL Tools

### Common Settings (Same for Every Tool):

1. **Request HTTP Method:** `POST` ✅
2. **Authorization Header:**
   - Name: `Authorization`
   - Value: `Bearer [YOUR-SUPABASE-ANON-KEY]`
3. **Content-Type Header:**
   - Name: `Content-Type`  
   - Value: `application/json`
   - (Usually auto-set by Vapi)

---

## Tool Configuration Template

For each tool, use this template:

```
Function Name: [tool-name]
Description: [tool description from vapi-tool-definitions.json]
Server URL: https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-[function-name]
Method: POST
Authorization: Bearer [YOUR-ANON-KEY]
Request Body Schema: [from vapi-tool-definitions.json]
```

---

## Complete Tool List

### 1. listEquipment ✅
- **Method:** POST
- **URL:** `.../vapi-list-equipment`
- **Auth:** Bearer token required

### 2. checkAvailability ✅
- **Method:** POST
- **URL:** `.../vapi-check-availability`
- **Auth:** Bearer token required

### 3. createBooking ✅
- **Method:** POST
- **URL:** `.../vapi-create-booking`
- **Auth:** Bearer token required

### 4. getAvailableSlots ✅
- **Method:** POST
- **URL:** `.../vapi-get-available-slots`
- **Auth:** Bearer token required

### 5. listBookings ✅
- **Method:** POST
- **URL:** `.../vapi-list-bookings`
- **Auth:** Bearer token required

### 6. updateBooking ✅
- **Method:** POST
- **URL:** `.../vapi-update-booking`
- **Auth:** Bearer token required

---

## Critical Points to Verify

✅ **All tools MUST use POST method**
✅ **All Server URLs MUST include `/functions/v1/`**
✅ **All tools MUST have Authorization header: `Bearer [ANON-KEY]`**
✅ **All function names in URLs match deployed function names**
✅ **All Request Body Schemas match tool definitions**

---

## Testing After Configuration

After configuring each tool, test it:
1. Make a test phone call
2. Ask Vapi to use that tool (e.g., "list all equipment")
3. Check Vapi call logs for tool invocation
4. Check Supabase Edge Function logs for execution
5. Verify response is correct

---

**Remember:** POST method is required for ALL tools! ✅
