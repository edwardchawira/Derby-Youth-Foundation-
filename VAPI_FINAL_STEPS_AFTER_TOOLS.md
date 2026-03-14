# Final Steps After Adding Tools to Vapi

Congratulations! You've successfully added all your tools to Vapi. Now let's complete the setup:

## ✅ What You've Completed

- [x] Created Edge Functions in Supabase
- [x] Added all 5 tools to Vapi Assistant
- [x] Configured request body schemas

## 📋 Next Steps

### Step 1: Add System Message / Instructions

1. In your Vapi Assistant settings, find **"System Message"**, **"Instructions"**, or **"Prompt"** section
2. Copy and paste the system message from `VAPI_SYSTEM_PROMPT.md`

**Quick Copy:**
```
You are a friendly and professional booking assistant for Pinnacle SSA, a music studio and audio equipment rental service. Your role is to help customers book studio sessions or equipment rentals over the phone.

## Your Responsibilities

1. **Booking Management**:
   - Help customers book studio sessions or equipment rentals
   - Check availability before creating any bookings
   - Prevent double bookings by always verifying availability first
   - Collect necessary customer information (name, email, phone number)
   - Confirm all booking details before finalizing

2. **Availability**:
   - When a customer requests a specific date/time, use the `checkAvailability` function first
   - If they ask "what times are available" or "when can I book", use `getAvailableSlots`
   - Always suggest alternative times if their preferred slot is unavailable

3. **Important Rules**:
   - **Date Format**: Always use DD-MM-YYYY format (e.g., 25-12-2024 for December 25th, 2024). When customers say dates like "December 25th" or "the 25th", convert to "25-12-2024" format.
   - **Time Format**: Use 24-hour format (HH:MM) like "14:00" for 2 PM. When customers say "2 PM", convert to "14:00".
   - **Always Check Availability First**: Never create a booking without checking availability first using `checkAvailability` or `getAvailableSlots`.
   - **Be Conversational**: Keep responses natural and friendly. You're talking on the phone, so speak naturally, not like a robot.
   - **Confirmation**: Always repeat back the booking details before finalizing.

Be friendly, helpful, and professional at all times. You're representing Pinnacle SSA.
```

3. **Save** your assistant

---

### Step 2: Configure First Message (Optional but Recommended)

1. Find **"First Message"** or **"Greeting"** section in your assistant settings
2. Enter a friendly greeting, for example:
   ```
   Hello! I'm calling from Pinnacle SSA. How can I help you with your booking today?
   ```

---

### Step 3: Configure Phone Number

1. In Vapi dashboard, go to **"Phone Numbers"** or **"Numbers"** section
2. Click **"Purchase Number"** or **"Add Number"**
3. Select your country and area code
4. Choose a number from available options
5. **Purchase** the number (pricing varies by country)
6. **Assign your assistant** to the phone number:
   - Select the phone number
   - Find **"Assistant"** or **"Assign Assistant"** dropdown
   - Select your "Pinnacle Booking Assistant"
   - Click **"Save"** or **"Update"**

---

### Step 4: Test Your Integration

#### Test 1: Test Function Calls (If Available)

Some Vapi dashboards have a "Test" button for each function:
1. Go to your Tools/Functions section
2. Look for a "Test" button next to `checkAvailability`
3. Try calling it with test data:
   ```json
   {
     "booking_date": "25-12-2024",
     "booking_time": "14:00",
     "session_hours": 2
   }
   ```
4. Verify you get a response

#### Test 2: Make a Test Phone Call

1. **Call your Vapi phone number** from your phone
2. **Follow this test script:**

   **You:** "Hi, I'd like to book a studio session"
   
   **Vapi:** Should respond and ask for details
   
   **You:** "25th December at 2 PM for 2 hours"
   
   **Vapi:** Should check availability and ask for your information
   
   **You:** (When asked) "John Smith, john@test.com, +1234567890"

3. **Verify the booking was created:**
   - Go to Supabase Dashboard → Table Editor → `studio_bookings`
   - Check if your test booking appears
   - Or run this SQL query:
     ```sql
     SELECT * FROM studio_bookings 
     WHERE customer_email = 'john@test.com' 
     ORDER BY created_at DESC 
     LIMIT 1;
     ```

---

### Step 5: Monitor and Debug (If Needed)

#### Check Vapi Call Logs

1. In Vapi Dashboard → **"Calls"** or **"History"**
2. View your test call
3. Check:
   - Did functions get called?
   - Any errors in function calls?
   - What was the conversation flow?

#### Check Edge Function Logs

1. In Supabase Dashboard → **Edge Functions**
2. Click on a function (e.g., `vapi-create-booking`)
3. Go to **"Logs"** tab
4. Look for your function execution logs
5. Check for any errors

---

## 🎯 Complete Checklist

- [ ] ✅ All 5 tools added to Vapi
- [ ] ✅ System message/prompt added
- [ ] ✅ First message/greeting configured
- [ ] ✅ Phone number purchased
- [ ] ✅ Assistant assigned to phone number
- [ ] ✅ Test call made successfully
- [ ] ✅ Booking verified in Supabase database
- [ ] ✅ Function calls working correctly

---

## 🐛 Troubleshooting

### Vapi Not Calling Functions?

**Check:**
1. Are function names exact? (`checkAvailability`, not `check_availability`)
2. Are URLs correct? (check Supabase project URL)
3. Are headers correct? (Authorization with Bearer prefix)
4. Check Vapi call logs for errors

### Functions Returning Errors?

**Check:**
1. Supabase Edge Function logs for errors
2. Verify anon key is correct (not service_role key)
3. Test function directly with curl (see testing guide)
4. Check database tables exist and have data

### Dates Not Working?

**Check:**
1. System message mentions DD-MM-YYYY format
2. Functions are converting dates correctly (check logs)
3. Vapi is sending dates in correct format

### Double Bookings Still Happening?

**Check:**
1. `checkAvailability` is being called before `createBooking`
2. Edge function logs show conflict detection working
3. Database query is checking correct statuses ('pending', 'confirmed')

---

## 🎉 You're Done!

Once you complete these steps:
1. ✅ Your Vapi phone number is ready
2. ✅ Customers can call to book studio sessions
3. ✅ Double bookings are prevented automatically
4. ✅ Bookings are saved to your Supabase database

---

## 📚 Additional Resources

- **Full Setup Guide:** `VAPI_COMPLETE_SETUP.md`
- **Quick Reference:** `VAPI_QUICK_START.md`
- **Testing Guide:** `VAPI_TESTING_GUIDE.md`
- **System Prompt Options:** `VAPI_SYSTEM_PROMPT.md`

---

## 🚀 Next Enhancements (Optional)

After everything is working, you can:
- Add email confirmations for bookings
- Add SMS notifications
- Customize available time slots
- Add more booking types
- Integrate payment processing
- Add analytics and reporting

Good luck with your voice booking system! 🎉
