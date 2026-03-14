# How to Add Server Functions in Vapi

This guide shows you exactly how to add your Supabase Edge Functions to your Vapi Assistant.

## Prerequisites

Before you start, make sure you have:
- ✅ Created your Vapi Assistant
- ✅ Your Supabase Project URL (e.g., `https://abcdefghijklmnop.supabase.co`)
- ✅ Your Supabase anon key (starts with `eyJ`)
- ✅ Your Edge Functions deployed in Supabase

## Step-by-Step Instructions

### Step 1: Access Your Vapi Assistant

1. Go to **https://vapi.ai/dashboard**
2. Log in to your account
3. Find your assistant in the list (or create one if you haven't)
4. Click on your assistant to open the settings

### Step 2: Navigate to Functions Section

In your Vapi Assistant settings, look for one of these sections:
- **"Functions"** tab (usually in the main navigation)
- **"Server Functions"** section
- **"Tools"** section
- **"Custom Functions"** or **"External Functions"**

The exact name varies by Vapi's UI, but it's typically called "Functions" or "Server Functions".

### Step 3: Add Your First Function

Click **"+ Add Function"**, **"Create Function"**, or **"Add Server Function"** button.

### Step 4: Fill in Function Details

For each function, you'll need to fill in:

#### **Function Name** (Required)
This is the name Vapi will use to call your function. Use exact names:
- `checkAvailability`
- `getAvailableSlots`
- `createBooking`
- `listBookings`
- `updateBooking`

#### **Server URL** (Required)
Your Supabase Edge Function endpoint:
```
https://[YOUR-PROJECT-URL]/functions/v1/[FUNCTION-NAME]
```

**Example:**
- `https://abcdefghijklmnop.supabase.co/functions/v1/vapi-check-availability`

#### **Method** (Required)
Select: **POST**

#### **Headers** (Required)
Click "Add Header" or use a headers section, and add:

**Header 1:**
- **Key**: `Authorization`
- **Value**: `Bearer [YOUR-ANON-KEY]`
  - Replace `[YOUR-ANON-KEY]` with your actual Supabase anon key
  - Keep the word "Bearer" with a space after it

**Header 2:**
- **Key**: `Content-Type`
- **Value**: `application/json`

#### **Function Schema** (Optional - Usually Auto-Detected)
Vapi may auto-detect your function schema, or you may need to:
- Paste the JSON schema from `vapi-tool-definitions.json`
- Or let Vapi detect it automatically when you test

### Step 5: Repeat for All 5 Functions

Add all 5 functions one by one:

#### Function 1: checkAvailability
```
Function Name: checkAvailability
Server URL: https://[YOUR-PROJECT]/functions/v1/vapi-check-availability
Method: POST
Headers:
  Authorization: Bearer [YOUR-ANON-KEY]
  Content-Type: application/json
```

#### Function 2: getAvailableSlots
```
Function Name: getAvailableSlots
Server URL: https://[YOUR-PROJECT]/functions/v1/vapi-get-available-slots
Method: POST
Headers:
  Authorization: Bearer [YOUR-ANON-KEY]
  Content-Type: application/json
```

#### Function 3: createBooking
```
Function Name: createBooking
Server URL: https://[YOUR-PROJECT]/functions/v1/vapi-create-booking
Method: POST
Headers:
  Authorization: Bearer [YOUR-ANON-KEY]
  Content-Type: application/json
```

#### Function 4: listBookings
```
Function Name: listBookings
Server URL: https://[YOUR-PROJECT]/functions/v1/vapi-list-bookings
Method: POST
Headers:
  Authorization: Bearer [YOUR-ANON-KEY]
  Content-Type: application/json
```

#### Function 5: updateBooking
```
Function Name: updateBooking
Server URL: https://[YOUR-PROJECT]/functions/v1/vapi-update-booking
Method: POST
Headers:
  Authorization: Bearer [YOUR-ANON-KEY]
  Content-Type: application/json
```

### Step 6: Save Your Assistant

After adding all functions:
1. Click **"Save"** or **"Update Assistant"**
2. Wait for Vapi to validate the functions (may take a few seconds)

## Visual Guide (Typical Vapi UI)

```
Vapi Assistant Settings
├── General
│   ├── Name
│   ├── Model
│   └── Voice
├── Functions  ← Go here!
│   ├── [Existing functions...]
│   ├── + Add Function
│   │   ├── Function Name: checkAvailability
│   │   ├── Server URL: https://xxx.supabase.co/functions/v1/vapi-check-availability
│   │   ├── Method: POST
│   │   └── Headers:
│   │       ├── Authorization: Bearer eyJ...
│   │       └── Content-Type: application/json
│   ├── + Add Function (repeat for each)
│   └── Save
├── System Message
└── Phone Numbers
```

## Common UI Patterns in Vapi

### Pattern 1: Sidebar Navigation
```
Left Sidebar:
- General
- Functions ← Click here
- Voice
- Phone Numbers
```

### Pattern 2: Tabs
```
Top Tabs:
[General] [Functions] [Voice] [Numbers]
         ↑ Click here
```

### Pattern 3: Accordion/Sections
```
Settings Page:
▼ General Settings
  [Name, Model, etc.]

► Functions (Click to expand)
  [+ Add Function button]
```

## Testing Your Functions

After adding functions, test them:

1. **In Vapi Dashboard**:
   - Look for a "Test" or "Try Function" button next to each function
   - Or use Vapi's test call feature

2. **Via Phone Call**:
   - Make a test call to your Vapi number
   - Say: "I'd like to book a studio session"
   - Check Vapi's call logs to see if functions are being called

3. **Check Logs**:
   - In Vapi Dashboard → Calls → View call logs
   - Look for function call attempts
   - Check for errors in the logs

## Troubleshooting

### Can't Find Functions Section?
- Look for "Tools", "Custom Functions", or "External Functions"
- Check if you need to upgrade your Vapi plan (some features require paid plans)
- Try using Vapi's search/filter in the settings

### Function Not Working?
1. **Check URL**: Make sure the Supabase function URL is correct
2. **Check Headers**: Verify Authorization header has "Bearer " prefix
3. **Check Key**: Ensure you're using the **anon key**, not service_role key
4. **Check Function Name**: Must match exactly (case-sensitive)
5. **Test Directly**: Test your Supabase function with curl first

### Testing with curl:
```bash
curl -X POST https://[YOUR-PROJECT]/functions/v1/vapi-check-availability \
  -H "Authorization: Bearer [YOUR-ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_date": "25-12-2024",
    "booking_time": "14:00",
    "session_hours": 2
  }'
```

### Function Schema Not Auto-Detecting?
1. Go to `vapi-tool-definitions.json` in your project
2. Copy the relevant function definition (the object with that function's name)
3. Paste it into Vapi's function schema/parameters section

### Getting 401 Unauthorized?
- Double-check your anon key is correct
- Ensure "Bearer " is included in the Authorization header (with space after Bearer)
- Verify the key hasn't expired or been regenerated

### Getting 404 Not Found?
- Verify function name matches exactly (e.g., `vapi-check-availability`)
- Check Supabase dashboard to confirm function is deployed
- Ensure function is active (not paused/disabled)

## Quick Reference: All Function URLs

Replace `[YOUR-PROJECT]` with your Supabase project URL:

```
checkAvailability:
https://[YOUR-PROJECT]/functions/v1/vapi-check-availability

getAvailableSlots:
https://[YOUR-PROJECT]/functions/v1/vapi-get-available-slots

createBooking:
https://[YOUR-PROJECT]/functions/v1/vapi-create-booking

listBookings:
https://[YOUR-PROJECT]/functions/v1/vapi-list-bookings

updateBooking:
https://[YOUR-PROJECT]/functions/v1/vapi-update-booking
```

## After Adding Functions

1. ✅ Save your assistant
2. ✅ Test one function manually (use test button if available)
3. ✅ Add system message (see `VAPI_SYSTEM_PROMPT.md`)
4. ✅ Configure phone number
5. ✅ Make a test call

You're all set! 🎉
