# Vapi Quick Start Guide

## Prerequisites

- ✅ Supabase project set up
- ✅ Vapi account created (https://vapi.ai)
- ✅ Supabase CLI installed: `npm install -g supabase`

## Quick Setup (5 Steps)

### Step 1: Deploy Edge Functions

```bash
# Link your project (first time only)
supabase login
supabase link --project-ref your-project-ref

# Deploy all Vapi functions
supabase functions deploy vapi-check-availability
supabase functions deploy vapi-get-available-slots
supabase functions deploy vapi-create-booking
supabase functions deploy vapi-list-bookings
```

### Step 2: Get Your Supabase URLs

1. Go to Supabase Dashboard → Settings → API
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`

### Step 3: Create Vapi Assistant

1. Go to https://vapi.ai/dashboard
2. Click "Create Assistant"
3. Configure:
   - **Name**: "Pinnacle Booking Assistant"
   - **Model**: GPT-4 or GPT-3.5-turbo
   - **Voice**: Choose your preferred voice
   - **First Message**: "Hello! I'm calling from Pinnacle SSA. How can I help you with your booking today?"

### Step 4: Add Server Functions to Vapi

In your Vapi Assistant settings, go to "Server Functions" and add:

#### Function 1: checkAvailability
```
Function Name: checkAvailability
Server URL: https://[YOUR-PROJECT].supabase.co/functions/v1/vapi-check-availability
Method: POST
Headers:
  Authorization: Bearer [YOUR-ANON-KEY]
  Content-Type: application/json
```

#### Function 2: getAvailableSlots
```
Function Name: getAvailableSlots
Server URL: https://[YOUR-PROJECT].supabase.co/functions/v1/vapi-get-available-slots
Method: POST
Headers: (same as above)
```

#### Function 3: createBooking
```
Function Name: createBooking
Server URL: https://[YOUR-PROJECT].supabase.co/functions/v1/vapi-create-booking
Method: POST
Headers: (same as above)
```

#### Function 4: listBookings
```
Function Name: listBookings
Server URL: https://[YOUR-PROJECT].supabase.co/functions/v1/vapi-list-bookings
Method: POST
Headers: (same as above)
```

### Step 5: Configure Phone Number

1. In Vapi dashboard, go to "Phone Numbers"
2. Purchase/configure a number
3. Assign your assistant to the number
4. Test by calling the number!

## Testing

**Test Call Script**:
1. Call your Vapi number
2. Say: "I'd like to book a studio session"
3. When asked for date, say: "25th December" or "25-12-2024" (DD-MM-YYYY format)
4. When asked for time, say: "2 PM" or "14:00"
5. When asked for details, provide:
   - Name: "Test User"
   - Email: "test@example.com"
   - Phone: Your number

**Verify Booking**:
```sql
SELECT * FROM studio_bookings 
WHERE customer_email = 'test@example.com' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Note**: Dates should be provided in DD-MM-YYYY format (e.g., `25-12-2024`)

## Example Conversation

**Customer**: "Hi, I want to book a studio"

**Vapi**: "I'd be happy to help! What date are you looking for?"

**Customer**: "Next Friday at 3 PM"

**Vapi**: "Let me check availability... I can confirm Friday at 3 PM is available. How many hours would you like to book?"

**Customer**: "2 hours"

**Vapi**: "Perfect! May I have your name and email?"

**Customer**: "John Smith, john@email.com"

**Vapi**: "Great! I've created your booking for Friday at 3 PM for 2 hours. Your booking reference is [ID]. You'll receive a confirmation email shortly. Anything else I can help with?"

## Troubleshooting

**Functions not deploying?**
- Check you're logged in: `supabase status`
- Verify project link: `supabase projects list`

**401 Unauthorized?**
- Double-check your anon key in Vapi
- Make sure Authorization header includes "Bearer "

**Double bookings happening?**
- Check Edge Function logs: `supabase functions logs vapi-create-booking`
- Verify conflict checking is working

## Next Steps

- Customize available time slots
- Add email confirmations
- Add SMS notifications
- Integrate with payment processing
