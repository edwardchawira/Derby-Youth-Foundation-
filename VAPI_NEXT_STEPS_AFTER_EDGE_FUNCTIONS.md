# Next Steps After Creating Edge Functions

You've successfully created the edge functions in Supabase! Follow these steps to complete the Vapi integration:

## Step 1: Get Your Supabase URLs and Keys

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Copy the following:
   - **Project URL**: `https://xxxxx.supabase.co` (looks like `https://abcdefghijklmnop.supabase.co`)
   - **anon public key**: `eyJhbGc...` (starts with `eyJ`, this is your public anon key)

**Important**: Use the **anon key** (not the service_role key) for Vapi authorization.

## Step 2: Test Your Edge Functions (Optional but Recommended)

Test that your functions are working before configuring Vapi:

```bash
# Replace [YOUR-PROJECT-URL] and [YOUR-ANON-KEY] with your actual values
curl -X POST https://[YOUR-PROJECT-URL]/functions/v1/vapi-check-availability \
  -H "Authorization: Bearer [YOUR-ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_date": "25-12-2024",
    "booking_time": "14:00",
    "session_hours": 2,
    "booking_type": "studio"
  }'
```

Expected response:
```json
{
  "available": true,
  "conflicts": [],
  "requested_date": "25-12-2024",
  "requested_time": "14:00",
  "requested_hours": 2
}
```

## Step 3: Create Vapi Assistant

1. Go to **https://vapi.ai/dashboard**
2. Sign up or log in
3. Click **"Create Assistant"** or **"+ New Assistant"**
4. Configure the assistant:
   - **Name**: `Pinnacle Booking Assistant` (or your preferred name)
   - **Model**: `GPT-4` or `GPT-3.5-turbo` (GPT-4 recommended for better tool calling)
   - **Voice**: Choose your preferred voice (e.g., Sarah, Adam, etc.)
   - **First Message**: `Hello! I'm calling from Pinnacle SSA. How can I help you with your booking today?`

## Step 4: Add Server Functions to Vapi

In your Vapi Assistant settings, find **"Server Functions"** or **"Functions"** section and add each function:

### Function 1: checkAvailability

- **Function Name**: `checkAvailability`
- **Server URL**: `https://[YOUR-PROJECT-URL]/functions/v1/vapi-check-availability`
  - Replace `[YOUR-PROJECT-URL]` with your Supabase project URL (e.g., `https://abcdefghijklmnop.supabase.co`)
- **Method**: `POST`
- **Headers**:
  - `Authorization`: `Bearer [YOUR-ANON-KEY]`
  - `Content-Type`: `application/json`

### Function 2: getAvailableSlots

- **Function Name**: `getAvailableSlots`
- **Server URL**: `https://[YOUR-PROJECT-URL]/functions/v1/vapi-get-available-slots`
- **Method**: `POST`
- **Headers**: (same as above)

### Function 3: createBooking

- **Function Name**: `createBooking`
- **Server URL**: `https://[YOUR-PROJECT-URL]/functions/v1/vapi-create-booking`
- **Method**: `POST`
- **Headers**: (same as above)

### Function 4: listBookings

- **Function Name**: `listBookings`
- **Server URL**: `https://[YOUR-PROJECT-URL]/functions/v1/vapi-list-bookings`
- **Method**: `POST`
- **Headers**: (same as above)

### Function 5: updateBooking (Optional)

- **Function Name**: `updateBooking`
- **Server URL**: `https://[YOUR-PROJECT-URL]/functions/v1/vapi-update-booking`
- **Method**: `POST`
- **Headers**: (same as above)

## Step 5: Add Tool Definitions (Function Schemas)

In your Vapi Assistant, find **"Functions"** or **"Tools"** section and add the function schemas. 

**Option A: Copy from `vapi-tool-definitions.json`**

Open `vapi-tool-definitions.json` in your project and copy the entire JSON array. Paste it into Vapi's function definitions section.

**Option B: Add individually in Vapi Dashboard**

Vapi usually auto-detects function schemas from your server functions, but you may need to manually configure parameters. Refer to `vapi-tool-definitions.json` for the exact schema.

**Key Points for Tool Definitions**:
- Date format: `DD-MM-YYYY` (e.g., `25-12-2024`)
- Time format: `HH:MM` (24-hour, e.g., `14:00`)
- All dates are validated and converted automatically

## Step 6: Configure System Message (Recommended)

Add a system message to guide the assistant's behavior:

```
You are a friendly booking assistant for Pinnacle SSA, a music studio and audio equipment rental service.

Your responsibilities:
- Help customers book studio sessions or equipment rentals
- Check availability before creating bookings
- Prevent double bookings
- Collect customer information (name, email, phone)
- Confirm booking details before finalizing
- Handle booking updates and cancellations

Important rules:
- Always use DD-MM-YYYY date format (e.g., 25-12-2024)
- Always check availability before creating a booking
- Be friendly, professional, and helpful
- Confirm all details before finalizing a booking
- If a time slot is unavailable, suggest alternative times
```

## Step 7: Configure Phone Number

1. In Vapi dashboard, go to **"Phone Numbers"** or **"Numbers"**
2. Click **"Purchase Number"** or **"Add Number"**
3. Select your country and area code
4. Purchase the number (pricing varies by country)
5. Assign your assistant to the phone number:
   - Select the phone number
   - Choose your assistant from the dropdown
   - Save settings

## Step 8: Test Your Integration

### Test via Phone Call

1. Call your Vapi phone number
2. Follow this test script:

**Customer**: "Hi, I'd like to book a studio session"

**Vapi**: Should respond and ask for details

**Customer**: "25th December at 2 PM for 2 hours"

**Customer**: (When asked) "John Smith, john@test.com, +1234567890"

3. Verify the booking was created in Supabase:
   ```sql
   SELECT * FROM studio_bookings 
   WHERE customer_email = 'john@test.com' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

### Test Conflict Detection

1. Create a booking via Supabase dashboard or API
2. Call Vapi and try to book the same time slot
3. Vapi should detect the conflict and suggest alternatives

## Step 9: Monitor and Debug

### Check Edge Function Logs

In Supabase Dashboard:
1. Go to **Edge Functions**
2. Click on a function (e.g., `vapi-create-booking`)
3. View **Logs** tab to see function execution logs

### Check Vapi Call Logs

In Vapi Dashboard:
1. Go to **Calls** or **History**
2. View call recordings and transcripts
3. Check function call logs to see if functions are being called correctly

### Common Issues

**401 Unauthorized Error**:
- Double-check your anon key in Vapi function headers
- Ensure `Authorization: Bearer [KEY]` format is correct
- Verify the key is the **anon public key**, not service_role key

**404 Not Found Error**:
- Verify the function name matches exactly (case-sensitive)
- Check the Supabase project URL is correct
- Ensure functions are deployed and active

**Double Bookings**:
- Check edge function logs for conflict detection
- Verify `booking_status` filtering includes 'pending' and 'confirmed'
- Test conflict detection manually with curl

**Date Format Errors**:
- Ensure dates are in `DD-MM-YYYY` format (e.g., `25-12-2024`)
- Functions automatically convert to database format
- Check function logs for date parsing errors

## Step 10: Customize (Optional)

### Adjust Available Time Slots

Edit `vapi-get-available-slots/index.ts` and modify:
```typescript
const AVAILABLE_SLOTS = [
  '09:00', '10:00', '11:00', // Add/remove slots as needed
];
```

Then redeploy the function.

### Customize System Message

Adjust the system message in Vapi to match your business needs and tone.

### Add Email Confirmations

Integrate email sending in `vapi-create-booking` to send confirmation emails to customers.

## Quick Checklist

- [ ] Got Supabase Project URL and anon key
- [ ] Tested edge functions with curl
- [ ] Created Vapi Assistant
- [ ] Added all 5 server functions to Vapi
- [ ] Configured function schemas/tool definitions
- [ ] Added system message
- [ ] Purchased and configured phone number
- [ ] Tested phone call booking flow
- [ ] Verified booking creation in database
- [ ] Tested conflict detection

## Need Help?

- Check `VAPI_QUICK_START.md` for quick reference
- See `VAPI_INTEGRATION_GUIDE.md` for detailed documentation
- Review `VAPI_TESTING_GUIDE.md` for testing scenarios
- Check Supabase Edge Function logs for errors
- Review Vapi call logs for function call issues

You're almost done! Once you complete these steps, customers will be able to book via phone calls. 🎉
