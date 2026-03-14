# Vapi Voice Agent Integration Guide

## Overview

This guide walks you through integrating Vapi voice agent with your Pinnacle SSA booking system using Supabase Edge Functions. The voice agent can handle phone bookings while preventing double bookings through calendar conflict detection.

## Architecture

```
Phone Call → Vapi Voice Agent → Supabase Edge Functions → Database
                                     ↓
                            Calendar Conflict Check
                                     ↓
                            Create/Update Booking
```

## Edge Functions Created

### 1. `vapi-check-availability`
**Purpose**: Check if a specific time slot is available
**Endpoint**: `https://[your-project].supabase.co/functions/v1/vapi-check-availability`

**Request**:
```json
{
  "booking_date": "25-12-2024",
  "booking_time": "14:00",
  "session_hours": 2,
  "booking_type": "studio" // or "equipment"
}
```

**Response**:
```json
{
  "available": true,
  "conflicts": [],
  "requested_date": "25-12-2024",
  "requested_time": "14:00",
  "requested_hours": 2
}
```

### 2. `vapi-get-available-slots`
**Purpose**: Get all available time slots for a date
**Endpoint**: `https://[your-project].supabase.co/functions/v1/vapi-get-available-slots`

**Request**:
```json
{
  "booking_date": "25-12-2024",
  "booking_type": "studio",
  "session_hours": 1
}
```

**Response**:
```json
{
  "booking_date": "25-12-2024",
  "available_slots": ["09:00", "10:00", "11:00", "14:00", "15:00"],
  "recommended_slots": ["09:00", "10:00", "11:00", "14:00", "15:00"]
}
```

### 3. `vapi-create-booking`
**Purpose**: Create a new booking (with conflict checking)
**Endpoint**: `https://[your-project].supabase.co/functions/v1/vapi-create-booking`

**Request**:
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+1234567890",
  "booking_date": "25-12-2024",
  "booking_time": "14:00",
  "session_hours": 2,
  "booking_type": "studio",
  "package_name": "Rehearsal Space",
  "package_price": 50.00,
  "special_requests": "Need piano"
}
```

**Response**:
```json
{
  "success": true,
  "booking": { /* booking object */ },
  "booking_id": "uuid-here",
  "booking_number": "uuid-here",
  "message": "Booking created successfully..."
}
```

### 4. `vapi-list-bookings`
**Purpose**: List customer's existing bookings
**Endpoint**: `https://[your-project].supabase.co/functions/v1/vapi-list-bookings`

**Request**:
```json
{
  "customer_email": "john@example.com",
  "customer_phone": "+1234567890",
  "booking_type": "studio", // optional
  "date_from": "01-12-2024", // optional (DD-MM-YYYY format)
  "date_to": "31-12-2024" // optional (DD-MM-YYYY format)
}
```

## Step-by-Step Setup

### Step 1: Deploy Edge Functions

1. **Install Supabase CLI** (if not already installed):
```bash
npm install -g supabase
```

2. **Login to Supabase**:
```bash
supabase login
```

3. **Link your project**:
```bash
supabase link --project-ref your-project-ref
```

4. **Deploy the functions**:
```bash
supabase functions deploy vapi-check-availability
supabase functions deploy vapi-get-available-slots
supabase functions deploy vapi-create-booking
supabase functions deploy vapi-list-bookings
```

### Step 2: Set Up Vapi Account

1. **Create Vapi Account**: https://vapi.ai
2. **Get your API Key** from Vapi dashboard
3. **Create a new Assistant** in Vapi dashboard

### Step 3: Configure Vapi Assistant

#### 3.1 Assistant Configuration

In Vapi dashboard, configure your assistant with:

**Model**: GPT-4 or GPT-3.5-turbo
**Voice**: Choose your preferred voice (e.g., Sarah, Michael)

#### 3.2 System Message

Add this system message to guide the assistant:

```
You are a helpful booking assistant for Pinnacle SSA, a professional audio equipment rental and studio services company.

Your capabilities:
1. Check availability for studio sessions or equipment rental
2. Create bookings for customers over the phone
3. List existing bookings for customers
4. Prevent double bookings by checking calendar conflicts

When a customer wants to book:
1. First, check availability using the check-availability function
2. If available, create the booking using create-booking function
3. Confirm booking details with the customer

Always be friendly, professional, and confirm all details before creating a booking.
```

#### 3.3 Add Server Functions (Tools)

In Vapi dashboard, add these server functions:

**Function 1: checkAvailability**
- **Server URL**: `https://[your-project].supabase.co/functions/v1/vapi-check-availability`
- **Method**: POST
- **Headers**:
  - `Authorization: Bearer [YOUR_SUPABASE_ANON_KEY]`
  - `Content-Type: application/json`
- **Function Name**: `checkAvailability`
- **Description**: "Check if a time slot is available for booking. Returns available status and any conflicts."

**Function 2: getAvailableSlots**
- **Server URL**: `https://[your-project].supabase.co/functions/v1/vapi-get-available-slots`
- **Method**: POST
- **Headers**: Same as above
- **Function Name**: `getAvailableSlots`
- **Description**: "Get all available time slots for a specific date. Returns list of available times."

**Function 3: createBooking**
- **Server URL**: `https://[your-project].supabase.co/functions/v1/vapi-create-booking`
- **Method**: POST
- **Headers**: Same as above
- **Function Name**: `createBooking`
- **Description**: "Create a new booking. Automatically checks for conflicts before creating. Returns booking confirmation."

**Function 4: listBookings**
- **Server URL**: `https://[your-project].supabase.co/functions/v1/vapi-list-bookings`
- **Method**: POST
- **Headers**: Same as above
- **Function Name**: `listBookings`
- **Description**: "List existing bookings for a customer. Searches by email or phone number."

### Step 4: Configure Phone Number

1. In Vapi dashboard, go to "Phone Numbers"
2. Purchase/configure a phone number
3. Assign your assistant to the phone number
4. Test the number

### Step 5: Test the Integration

1. **Test Availability Check**:
   - Call your Vapi phone number
   - Say: "I'd like to check if December 25th at 2 PM is available"
   - The assistant should call `checkAvailability` and respond

2. **Test Booking Creation**:
   - Call and say: "I want to book a studio session for December 25th at 2 PM"
   - Provide your name, email, and phone when asked
   - The assistant should create the booking

3. **Test Conflict Detection**:
   - Book a slot
   - Try to book the same slot again
   - The assistant should detect the conflict and suggest alternatives

## Example Conversation Flow

**Customer**: "Hi, I'd like to book a studio session"

**Vapi**: "I'd be happy to help you book a studio session. What date are you looking for?"

**Customer**: "December 25th at 2 PM"

**Vapi**: "Let me check availability... I can confirm that December 25th at 2 PM is available. How many hours would you like to book?"

**Customer**: "2 hours"

**Vapi**: "Perfect. May I have your name and email address?"

**Customer**: "John Doe, john@example.com"

**Vapi**: "Thank you. I've created your booking for December 25th at 2 PM for 2 hours. Your booking reference is [booking_id]. Is there anything else I can help you with?"

## Security Considerations

1. **Edge Functions use Service Role Key**: These functions use the service role key for full database access. Keep your keys secure.

2. **Rate Limiting**: Consider adding rate limiting to prevent abuse.

3. **Input Validation**: All inputs are validated in the Edge Functions.

4. **CORS**: CORS headers are configured to allow Vapi requests.

## Troubleshooting

### Function Not Found
- Verify the function is deployed: `supabase functions list`
- Check the function name matches exactly

### 401 Unauthorized
- Verify your Supabase anon key is correct in Vapi
- Check the Authorization header format

### 500 Internal Server Error
- Check Supabase function logs: `supabase functions logs [function-name]`
- Verify database connection and RLS policies

### Double Bookings Still Happening
- Verify conflict checking logic in `vapi-create-booking`
- Check that `booking_status` filtering includes both 'pending' and 'confirmed'

## Next Steps

1. **Customize Time Slots**: Edit `AVAILABLE_SLOTS` in `vapi-get-available-slots`
2. **Add Business Hours**: Add business hours validation
3. **Email Confirmations**: Integrate email sending after booking creation
4. **SMS Notifications**: Send SMS confirmations via Twilio
5. **Calendar Integration**: Sync with Google Calendar or Outlook

## Support

For issues:
1. Check Supabase function logs
2. Check Vapi dashboard for call logs
3. Test Edge Functions directly using curl or Postman
