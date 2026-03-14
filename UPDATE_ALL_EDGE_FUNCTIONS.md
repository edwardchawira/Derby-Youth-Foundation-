# Update All Edge Functions in Supabase

All edge functions have been updated to support **POST requests** (required by Vapi) and use `Deno.serve` (Supabase standard).

---

## 📁 All Updated Functions

All updated function code is in the **`EDGE_FUNCTIONS_SUPABASE`** directory:

1. ✅ **list-equipment.ts** - List available equipment (supports GET & POST)
2. ✅ **vapi-check-availability.ts** - Check booking availability (supports GET & POST)
3. ✅ **vapi-get-available-slots.ts** - Get available time slots (supports GET & POST)
4. ✅ **vapi-list-bookings.ts** - List customer bookings (supports GET & POST)
5. ✅ **vapi-get-pricing.ts** - Get pricing information (supports GET & POST)

**Missing Functions** (need to be created):
6. ⚠️ **vapi-create-booking.ts** - Create new booking
7. ⚠️ **vapi-update-booking.ts** - Update/cancel booking

---

## 🚀 How to Update in Supabase

### For Each Function:

1. **Go to Supabase Dashboard** → **Edge Functions**
2. **Click on the function name** (or create it if it doesn't exist)
3. **Select ALL code** (Ctrl+A / Cmd+A)
4. **Delete it**
5. **Open the file** from `EDGE_FUNCTIONS_SUPABASE/` directory
6. **Copy ALL code** from that file
7. **Paste** into Supabase editor
8. **Click "Deploy"** or "Save"

---

## ⚙️ Environment Variables

Make sure these are set in **Supabase Dashboard** → **Edge Functions** → **Settings** → **Secrets**:

- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ What's Fixed

All functions now:
- ✅ Use `Deno.serve` (Supabase standard)
- ✅ Support **POST** requests (Vapi requirement)
- ✅ Read from **JSON body** when POST is used
- ✅ Maintain **GET** support (backwards compatibility)
- ✅ Use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- ✅ Include **CORS headers**
- ✅ Have **comprehensive logging**

---

## 🧪 Test After Update

Test each function with:

```powershell
Invoke-RestMethod -Uri "https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/FUNCTION_NAME" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer YOUR_ANON_KEY"
    "Content-Type" = "application/json"
  } `
  -Body '{}'
```

Replace `FUNCTION_NAME` with the actual function name.

---

## 📝 Notes

- **Date Format**: All date inputs should be **DD-MM-YYYY** (e.g., `25-12-2024`)
- **list-equipment**: Works with both `equipment_items` (newer) and `equipment` (legacy) tables
- Check Supabase logs after updating to verify functions are being called
