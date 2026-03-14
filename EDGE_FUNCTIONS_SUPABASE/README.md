# Edge Functions for Supabase - Ready to Deploy

All functions in this directory support **POST requests** (required by Vapi) and use `Deno.serve` (Supabase standard).

---

## How to Update Functions in Supabase

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Edge Functions** (left sidebar)

### Step 2: Update Each Function

For each function below:

1. **Click on the function name** (or create it if it doesn't exist)
2. **Select ALL existing code** (Ctrl+A / Cmd+A)
3. **Delete it**
4. **Open the corresponding file** from this directory
5. **Copy ALL the code** from the file
6. **Paste it** into the Supabase editor
7. **Click "Deploy"** or "Save"

---

## Functions to Update

### 1. list-equipment (or vapi-list-equipment)
- **File:** `list-equipment.ts`
- **Supabase Function Name:** `list-equipment` (or create as `vapi-list-equipment`)
- **Supports:** GET and POST
- **Purpose:** List available equipment for rental

### 2. vapi-check-availability
- **File:** `vapi-check-availability.ts`
- **Supabase Function Name:** `vapi-check-availability`
- **Supports:** GET and POST
- **Purpose:** Check if a booking time slot is available

### 3. vapi-get-available-slots
- **File:** `vapi-get-available-slots.ts`
- **Supabase Function Name:** `vapi-get-available-slots`
- **Supports:** GET and POST
- **Purpose:** Get list of available time slots for a date

### 4. vapi-create-booking
- **File:** `vapi-create-booking.ts`
- **Supabase Function Name:** `vapi-create-booking`
- **Supports:** GET and POST
- **Purpose:** Create a new booking (studio or equipment)

### 5. vapi-list-bookings
- **File:** `vapi-list-bookings.ts`
- **Supabase Function Name:** `vapi-list-bookings`
- **Supports:** GET and POST
- **Purpose:** List customer's existing bookings

### 6. vapi-update-booking
- **File:** `vapi-update-booking.ts`
- **Supabase Function Name:** `vapi-update-booking`
- **Supports:** GET and POST
- **Purpose:** Update or cancel existing bookings

### 7. vapi-get-pricing
- **File:** `vapi-get-pricing.ts`
- **Supabase Function Name:** `vapi-get-pricing`
- **Supports:** GET and POST
- **Purpose:** Get studio session pricing information

---

## Environment Variables Required

Make sure these are set in **Supabase Dashboard** → **Edge Functions** → **Settings** → **Secrets**:

- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (preferred for Vapi - bypasses RLS)

---

## Testing After Update

After updating each function, test it with:

```powershell
Invoke-RestMethod -Uri "https://YOUR_PROJECT.supabase.co/functions/v1/FUNCTION_NAME" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer YOUR_ANON_KEY"
    "Content-Type" = "application/json"
  } `
  -Body '{}'
```

Replace:
- `YOUR_PROJECT` with your Supabase project reference
- `FUNCTION_NAME` with the function name
- `YOUR_ANON_KEY` with your Supabase anon key

---

## What Changed?

All functions now:
- ✅ Use `Deno.serve` (Supabase standard)
- ✅ Support POST requests (required by Vapi)
- ✅ Read from JSON body when POST is used
- ✅ Maintain GET support for backwards compatibility
- ✅ Use `SUPABASE_SERVICE_ROLE_KEY` for better RLS bypass
- ✅ Include CORS headers
- ✅ Have comprehensive error logging

---

## Notes

- **list-equipment**: This function supports both `equipment_items` (newer) and `equipment` (legacy) tables
- All date inputs should be in **DD-MM-YYYY** format (e.g., `25-12-2024`)
- All functions handle date conversion automatically for database storage
