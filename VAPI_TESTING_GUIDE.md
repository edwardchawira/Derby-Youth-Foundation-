# Vapi Testing Guide

## Testing Edge Functions Locally

### Before Deploying

Test functions locally using Supabase CLI:

```bash
# Start local Supabase (if testing locally)
supabase start

# Test check-availability (DD-MM-YYYY format)
curl -X POST http://localhost:54321/functions/v1/vapi-check-availability \
  -H "Authorization: Bearer [ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_date": "25-12-2024",
    "booking_time": "14:00",
    "session_hours": 2,
    "booking_type": "studio"
  }'

# Test create-booking (DD-MM-YYYY format)
curl -X POST http://localhost:54321/functions/v1/vapi-create-booking \
  -H "Authorization: Bearer [ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "customer_phone": "+1234567890",
    "booking_date": "25-12-2024",
    "booking_time": "14:00",
    "session_hours": 2,
    "booking_type": "studio",
    "package_name": "Rehearsal Space",
    "package_price": 50.00
  }'
```

## Testing in Production

### 1. Test Availability Check

```bash
curl -X POST https://[YOUR-PROJECT].supabase.co/functions/v1/vapi-check-availability \
  -H "Authorization: Bearer [YOUR-ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_date": "25-12-2024",
    "booking_time": "14:00",
    "session_hours": 2
  }'
```

### 2. Test Conflict Detection

1. Create a booking via API or dashboard
2. Try to create another booking at the same time
3. Should receive conflict error

```bash
# First booking (DD-MM-YYYY format)
curl -X POST https://[YOUR-PROJECT].supabase.co/functions/v1/vapi-create-booking \
  -H "Authorization: Bearer [YOUR-ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "First User",
    "customer_email": "first@example.com",
    "booking_date": "25-12-2024",
    "booking_time": "14:00",
    "session_hours": 2,
    "booking_type": "studio",
    "package_name": "Studio",
    "package_price": 50
  }'

# Try to book same slot (should fail)
curl -X POST https://[YOUR-PROJECT].supabase.co/functions/v1/vapi-create-booking \
  -H "Authorization: Bearer [YOUR-ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Second User",
    "customer_email": "second@example.com",
    "booking_date": "25-12-2024",
    "booking_time": "14:00",
    "session_hours": 1,
    "booking_type": "studio",
    "package_name": "Studio",
    "package_price": 50
  }'
```

Expected response for conflict:
```json
{
  "success": false,
  "error": "Booking conflict detected",
  "message": "Sorry, the time slot 14:00 on 2024-12-25 is already booked..."
}
```

## Testing Voice Agent

### Test Scenario 1: Simple Booking

1. Call Vapi number
2. Say: "I want to book a studio session for tomorrow at 2 PM"
3. Provide details when asked
4. Verify booking was created in database

### Test Scenario 2: Conflict Handling

1. Create a booking via dashboard for Dec 25th at 2 PM
2. Call Vapi number
3. Say: "I want to book 25th December at 2 PM" or "25-12-2024 at 2 PM"
4. Vapi should detect conflict and suggest alternatives

### Test Scenario 3: Availability Query

1. Call Vapi number
2. Say: "What times are available on 25th December?" or "25-12-2024"
3. Vapi should list available slots

### Test Scenario 4: List Bookings

1. Create a booking with email: test@example.com
2. Call Vapi number
3. Say: "What are my bookings?"
4. Provide email when asked
5. Vapi should list your bookings

## Monitoring

### Check Edge Function Logs

```bash
# View logs for a function
supabase functions logs vapi-create-booking

# View logs in real-time
supabase functions logs vapi-create-booking --follow
```

### Check Database

```sql
-- View recent bookings
SELECT * FROM studio_bookings 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for conflicts
SELECT booking_date, booking_time, COUNT(*) as count
FROM studio_bookings
WHERE booking_status IN ('pending', 'confirmed')
GROUP BY booking_date, booking_time
HAVING COUNT(*) > 1;
```

## Common Issues

### Issue: Function Returns 404
**Solution**: Verify function is deployed and name matches exactly

### Issue: Double Booking Still Happens
**Solution**: 
1. Check function logs for errors
2. Verify `booking_status` filtering includes 'pending' and 'confirmed'
3. Test conflict detection manually

### Issue: Vapi Can't Call Functions
**Solution**:
1. Verify Authorization header format: `Bearer [KEY]`
2. Check CORS headers are set correctly
3. Verify function URL is correct
