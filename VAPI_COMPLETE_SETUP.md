# Complete Vapi Voice Agent Setup Guide

## 📋 Overview

This guide provides a complete walkthrough for integrating Vapi voice agent with your Pinnacle SSA booking system. The integration enables customers to place bookings over the phone with automatic calendar conflict prevention.

## 🏗️ Architecture

```
┌─────────────┐
│ Phone Call  │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  Vapi Voice AI   │
└──────┬───────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Supabase Edge Functions         │
│  ├─ check-availability           │
│  ├─ get-available-slots          │
│  ├─ create-booking               │
│  ├─ list-bookings                │
│  └─ update-booking               │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────┐
│  Supabase DB     │
│  ├─ studio_bookings│
│  ├─ bookings     │
│  └─ Calendar     │
└──────────────────┘
```

## 📦 Files Created

### Edge Functions
1. `supabase/functions/vapi-check-availability/index.ts` - Check if time slot is available
2. `supabase/functions/vapi-get-available-slots/index.ts` - Get all available slots for a date
3. `supabase/functions/vapi-create-booking/index.ts` - Create booking with conflict prevention
4. `supabase/functions/vapi-list-bookings/index.ts` - List customer's bookings
5. `supabase/functions/vapi-update-booking/index.ts` - Update or cancel bookings

### Database
6. `supabase/migrations/20251217000000_add_vapi_booking_calendar_support.sql` - Calendar optimization

### Documentation
7. `VAPI_INTEGRATION_GUIDE.md` - Full integration guide
8. `VAPI_QUICK_START.md` - Quick setup steps
9. `VAPI_TESTING_GUIDE.md` - Testing procedures
10. `vapi-tool-definitions.json` - Tool definitions for Vapi

## 🚀 Step-by-Step Setup

### Phase 1: Database Setup

1. **Run the SQL migration**:
```bash
# In Supabase SQL Editor, run:
supabase/migrations/20251217000000_add_vapi_booking_calendar_support.sql
```

Or via Supabase Dashboard:
- Go to SQL Editor
- Copy and paste the migration file content
- Run it

### Phase 2: Deploy Edge Functions

1. **Install Supabase CLI** (if not installed):
```bash
npm install -g supabase
```

2. **Login and link project**:
```bash
supabase login
supabase link --project-ref your-project-ref
# Get project-ref from Supabase Dashboard → Settings → General
```

3. **Deploy all functions**:
```bash
supabase functions deploy vapi-check-availability
supabase functions deploy vapi-get-available-slots
supabase functions deploy vapi-create-booking
supabase functions deploy vapi-list-bookings
supabase functions deploy vapi-update-booking
```

4. **Verify deployment**:
```bash
supabase functions list
```

### Phase 3: Configure Vapi

1. **Create Vapi Account**: https://vapi.ai

2. **Get your Supabase credentials**:
   - Go to Supabase Dashboard → Settings → API
   - Copy:
     - Project URL: `https://xxxxx.supabase.co`
     - anon public key

3. **Create Assistant in Vapi**:
   - Go to Vapi Dashboard → Assistants → Create
   - Configure:
     - **Name**: "Pinnacle Booking Assistant"
     - **Model**: GPT-4 (recommended) or GPT-3.5-turbo
     - **Voice**: Choose voice (e.g., Sarah, Michael)
     - **First Message**: "Hello! This is Pinnacle SSA. How can I help you with your booking today?"

4. **Add System Message**:
```
You are a professional booking assistant for Pinnacle SSA, a premium audio equipment rental and studio services company.

Your responsibilities:
- Help customers book studio sessions and equipment rentals over the phone
- Check availability before confirming bookings
- Prevent double bookings by verifying calendar conflicts
- Provide excellent customer service

Guidelines:
- Always confirm availability before creating a booking
- Collect customer name, email, and phone number
- Be friendly, professional, and clear
- Confirm all booking details before finalizing
- If a time slot is unavailable, suggest alternatives
```

5. **Add Server Functions** (Tools):

In Vapi Assistant settings → Server Functions → Add Function for each:

**Function 1: checkAvailability**
- Function Name: `checkAvailability`
- Server URL: `https://[YOUR-PROJECT].supabase.co/functions/v1/vapi-check-availability`
- Method: `POST`
- Headers:
  ```
  Authorization: Bearer [YOUR-ANON-KEY]
  Content-Type: application/json
  ```
- Description: "Check if a time slot is available for booking"

**Function 2: getAvailableSlots**
- Function Name: `getAvailableSlots`
- Server URL: `https://[YOUR-PROJECT].supabase.co/functions/v1/vapi-get-available-slots`
- (Same headers as above)

**Function 3: createBooking**
- Function Name: `createBooking`
- Server URL: `https://[YOUR-PROJECT].supabase.co/functions/v1/vapi-create-booking`
- (Same headers as above)

**Function 4: listBookings**
- Function Name: `listBookings`
- Server URL: `https://[YOUR-PROJECT].supabase.co/functions/v1/vapi-list-bookings`
- (Same headers as above)

**Function 5: updateBooking** (Optional)
- Function Name: `updateBooking`
- Server URL: `https://[YOUR-PROJECT].supabase.co/functions/v1/vapi-update-booking`
- (Same headers as above)

### Phase 4: Configure Phone Number

1. **Purchase Phone Number**:
   - Go to Vapi Dashboard → Phone Numbers
   - Click "Buy Number" or "Add Number"
   - Choose your country/region
   - Select a number

2. **Assign Assistant**:
   - Select your phone number
   - Choose your "Pinnacle Booking Assistant"
   - Save

3. **Test**:
   - Call the number
   - Test a booking conversation

## 🧪 Testing Checklist

- [ ] Test availability check works
- [ ] Test booking creation works
- [ ] Test conflict detection prevents double bookings
- [ ] Test listing bookings works
- [ ] Test voice conversation flow
- [ ] Verify bookings appear in database
- [ ] Test error handling (invalid dates, missing info)

## 📞 Example Conversation Flow

**Vapi**: "Hello! This is Pinnacle SSA. How can I help you with your booking today?"

**Customer**: "Hi, I'd like to book a studio session"

**Vapi**: "I'd be happy to help! What date are you looking for?"

**Customer**: "25th December at 2 PM" or "25-12-2024 at 2 PM"

**Vapi**: *[Calls checkAvailability]* "Let me check availability... Great! December 25th at 2 PM is available. How many hours would you like to book?"

**Customer**: "2 hours"

**Vapi**: "Perfect! May I have your name?"

**Customer**: "John Smith"

**Vapi**: "Thank you, John. What's your email address?"

**Customer**: "john@email.com"

**Vapi**: "And your phone number?"

**Customer**: "555-1234"

**Vapi**: *[Calls createBooking]* "Excellent! I've created your booking for 25th December at 2 PM for 2 hours. Your booking reference is [ID]. You'll receive a confirmation email shortly. Is there anything else I can help you with?"

**Note**: Dates are handled in DD-MM-YYYY format (e.g., `25-12-2024`).

## 🔒 Security Notes

- Edge Functions use Service Role Key for database access
- Customer verification via email/phone prevents unauthorized updates
- All inputs are validated
- CORS configured for Vapi requests only

## 🎛️ Customization

### Adjust Available Time Slots

Edit `supabase/functions/vapi-get-available-slots/index.ts`:
```typescript
const AVAILABLE_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', // ... customize here
];
```

### Business Hours

Edit the same file to change business hours:
```typescript
return slotEnd <= 21; // Change 21 to your closing hour
```

### Booking Duration Limits

In `vapi-create-booking/index.ts`, modify validation:
```typescript
"session_hours": {
  "minimum": 1,
  "maximum": 12  // Change max hours
}
```

## 📊 Monitoring

### View Function Logs
```bash
supabase functions logs vapi-create-booking --follow
```

### Check Database
```sql
-- Recent bookings
SELECT * FROM studio_bookings 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for conflicts
SELECT booking_date, booking_time, COUNT(*) 
FROM studio_bookings
WHERE booking_status IN ('pending', 'confirmed')
GROUP BY booking_date, booking_time
HAVING COUNT(*) > 1;
```

## 🐛 Troubleshooting

See `VAPI_TESTING_GUIDE.md` for detailed troubleshooting steps.

## ✅ Next Steps

1. ✅ Deploy functions
2. ✅ Configure Vapi assistant
3. ✅ Test phone booking
4. ⏭️ Add email confirmations
5. ⏭️ Add SMS notifications
6. ⏭️ Integrate payment processing
7. ⏭️ Add calendar sync (Google Calendar, etc.)
