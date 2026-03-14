# Vapi Tool Configuration - Field by Field Guide

This guide shows you exactly what to fill in for each field when adding a tool in Vapi.

## Quick Reference: What You Need

Before filling in, have ready:
- ✅ Supabase Project URL: `https://[YOUR-PROJECT].supabase.co`
- ✅ Supabase anon key: `eyJhbGc...` (starts with `eyJ`)

---

## Example: Setting Up `checkAvailability` Function

Here's how to fill in each field for the **checkAvailability** function:

### 1. **Tool Name / Function Name**
**Value:** `checkAvailability`

*(This is the name Vapi will use to call your function - must match exactly)*

---

### 2. **URL / Server URL**
**Value:** 
```
https://[YOUR-PROJECT-URL]/functions/v1/vapi-check-availability
```

**Example:**
```
https://abcdefghijklmnop.supabase.co/functions/v1/vapi-check-availability
```

**Steps:**
1. Replace `[YOUR-PROJECT-URL]` with your actual Supabase project URL
2. Keep `/functions/v1/vapi-check-availability` exactly as shown

---

### 3. **HTTP Method / Method**
**Value:** `POST`

*(Select "POST" from the dropdown)*

---

### 4. **Authorization**

If Vapi has a separate Authorization section, you have two options:

**Option A: Use Authorization Section (if available)**
- **Type:** Select "Bearer Token" or "API Key"
- **Token/Key:** `[YOUR-ANON-KEY]` (just the key, without "Bearer")

**Option B: Use Request Headers (if no separate section)**
- Skip this section and add Authorization in Request Headers instead

---

### 5. **Request Headers**

Click **"+ Add Header"** button and add these two headers:

**Header 1:**
- **Key:** `Authorization`
- **Value:** `Bearer [YOUR-ANON-KEY]`
  - Replace `[YOUR-ANON-KEY]` with your Supabase anon key
  - **Important:** Include the word "Bearer" followed by a space, then your key

**Header 2:**
- **Key:** `Content-Type`
- **Value:** `application/json`

---

### 6. **Request Body**

This defines the JSON schema for what data Vapi will send to your function. Paste this JSON:

```json
{
  "type": "object",
  "properties": {
    "booking_date": {
      "type": "string",
      "description": "The date for the booking in DD-MM-YYYY format. Example: '25-12-2024' for December 25th, 2024",
      "pattern": "^\\d{2}-\\d{2}-\\d{4}$"
    },
    "booking_time": {
      "type": "string",
      "description": "The start time for the booking in HH:MM format (24-hour). Example: '14:00' for 2 PM. Defaults to '09:00' if not provided.",
      "pattern": "^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
    },
    "session_hours": {
      "type": "number",
      "description": "Number of hours for the booking session. Defaults to 1 if not provided.",
      "minimum": 1,
      "maximum": 12
    },
    "booking_type": {
      "type": "string",
      "description": "Type of booking: 'studio' for studio sessions or 'equipment' for equipment rental. Defaults to 'studio'.",
      "enum": ["studio", "equipment"]
    }
  },
  "required": ["booking_date"]
}
```

**Note:** If Vapi has a schema builder/visual editor instead of raw JSON, you may need to:
1. Look for "Add Property" buttons
2. Add each property manually
3. Set types, descriptions, and required fields

---

### 7. **Encryption Settings**

**Leave as default or empty.**

For Supabase Edge Functions with HTTPS, encryption is handled automatically. You typically don't need to configure additional encryption at the Vapi level.

---

### 8. **Response Body**

**Optional for basic setup.** You can skip this initially, as Vapi often auto-detects response structure.

If you want to explicitly map response fields:

**Example for checkAvailability:**
- Variable Name: `isAvailable`
- Path: `$.available`

- Variable Name: `conflicts`
- Path: `$.conflicts`

This helps Vapi understand the response structure for use in conversations.

---

### 9. **Aliases**

**Leave empty for now.** 

Aliases are for advanced mapping. You can configure these later if needed.

---

## Configuration for All 5 Functions

### Function 2: getAvailableSlots

**Tool Name:** `getAvailableSlots`

**URL:** 
```
https://[YOUR-PROJECT]/functions/v1/vapi-get-available-slots
```

**Method:** `POST`

**Headers:** (Same as above)
- `Authorization`: `Bearer [YOUR-ANON-KEY]`
- `Content-Type`: `application/json`

**Request Body:**
```json
{
  "type": "object",
  "properties": {
    "booking_date": {
      "type": "string",
      "description": "The date to check availability for in DD-MM-YYYY format. Example: '25-12-2024' for December 25th, 2024",
      "pattern": "^\\d{2}-\\d{2}-\\d{4}$"
    },
    "booking_type": {
      "type": "string",
      "description": "Type of booking: 'studio' for studio sessions or 'equipment' for equipment rental. Defaults to 'studio'.",
      "enum": ["studio", "equipment"]
    },
    "session_hours": {
      "type": "integer",
      "description": "Number of hours needed for the session. Used to find slots that can accommodate this duration. Defaults to 1.",
      "minimum": 1,
      "maximum": 12
    }
  },
  "required": ["booking_date"]
}
```

---

### Function 3: createBooking

**Tool Name:** `createBooking`

**URL:**
```
https://[YOUR-PROJECT]/functions/v1/vapi-create-booking
```

**Method:** `POST`

**Headers:** (Same as above)

**Request Body:**
```json
{
  "type": "object",
  "properties": {
    "customer_name": {
      "type": "string",
      "description": "Full name of the customer making the booking"
    },
    "customer_email": {
      "type": "string",
      "description": "Email address of the customer. Used for booking confirmation.",
      "format": "email"
    },
    "customer_phone": {
      "type": "string",
      "description": "Phone number of the customer. Include country code if available. Example: '+1234567890'"
    },
    "booking_date": {
      "type": "string",
      "description": "Date of the booking in DD-MM-YYYY format. Example: '25-12-2024' for December 25th, 2024",
      "pattern": "^\\d{2}-\\d{2}-\\d{4}$"
    },
    "booking_time": {
      "type": "string",
      "description": "Start time in HH:MM format (24-hour). Example: '14:00' for 2 PM. Required for studio bookings.",
      "pattern": "^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
    },
    "session_hours": {
      "type": "integer",
      "description": "Number of hours for the booking session",
      "minimum": 1,
      "maximum": 12,
      "default": 1
    },
    "booking_type": {
      "type": "string",
      "description": "Type of booking: 'studio' for studio sessions or 'equipment' for equipment rental",
      "enum": ["studio", "equipment"]
    },
    "package_name": {
      "type": "string",
      "description": "Name of the package or service. For studio: 'Rehearsal Space', 'Recording Studio', etc. For equipment: package name if applicable."
    },
    "package_price": {
      "type": "number",
      "description": "Price of the booking in your currency (e.g., 50.00 for $50)"
    },
    "special_requests": {
      "type": "string",
      "description": "Any special requests or notes from the customer. Optional."
    }
  },
  "required": ["customer_name", "customer_email", "booking_date", "booking_type"]
}
```

---

### Function 4: listBookings

**Tool Name:** `listBookings`

**URL:**
```
https://[YOUR-PROJECT]/functions/v1/vapi-list-bookings
```

**Method:** `POST`

**Headers:** (Same as above)

**Request Body:**
```json
{
  "type": "object",
  "properties": {
    "customer_email": {
      "type": "string",
      "description": "Email address of the customer to search for bookings",
      "format": "email"
    },
    "customer_phone": {
      "type": "string",
      "description": "Phone number of the customer to search for bookings. Include country code if available."
    },
    "booking_type": {
      "type": "string",
      "description": "Filter by booking type: 'studio', 'equipment', or omit to get all types",
      "enum": ["studio", "equipment"]
    },
    "date_from": {
      "type": "string",
      "description": "Filter bookings from this date in DD-MM-YYYY format (e.g., '01-12-2024'). Optional, defaults to today if not provided.",
      "pattern": "^\\d{2}-\\d{2}-\\d{4}$"
    },
    "date_to": {
      "type": "string",
      "description": "Filter bookings up to this date in DD-MM-YYYY format (e.g., '31-12-2024'). Optional.",
      "pattern": "^\\d{2}-\\d{2}-\\d{4}$"
    }
  },
  "required": []
}
```

---

### Function 5: updateBooking

**Tool Name:** `updateBooking`

**URL:**
```
https://[YOUR-PROJECT]/functions/v1/vapi-update-booking
```

**Method:** `POST`

**Headers:** (Same as above)

**Request Body:**
```json
{
  "type": "object",
  "properties": {
    "booking_id": {
      "type": "string",
      "description": "The UUID of the booking to update or cancel"
    },
    "booking_type": {
      "type": "string",
      "description": "Type of booking: 'studio' for studio sessions or 'equipment' for equipment rental",
      "enum": ["studio", "equipment"],
      "default": "studio"
    },
    "action": {
      "type": "string",
      "description": "Action to perform: 'update' to modify booking details or 'cancel' to cancel the booking",
      "enum": ["update", "cancel"],
      "default": "update"
    },
    "customer_email": {
      "type": "string",
      "description": "Email address for verification. Optional but recommended for security.",
      "format": "email"
    },
    "new_booking_date": {
      "type": "string",
      "description": "New date for the booking in DD-MM-YYYY format (e.g., '25-12-2024'). Required only if updating date.",
      "pattern": "^\\d{2}-\\d{2}-\\d{4}$"
    },
    "new_booking_time": {
      "type": "string",
      "description": "New start time in HH:MM format (24-hour). Example: '14:00'. Required only if updating time.",
      "pattern": "^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
    },
    "new_session_hours": {
      "type": "integer",
      "description": "New duration in hours. Required only if updating duration.",
      "minimum": 1,
      "maximum": 12
    },
    "new_special_requests": {
      "type": "string",
      "description": "Updated special requests or notes. Optional."
    }
  },
  "required": ["booking_id"]
}
```

---

## Quick Checklist

When filling in each function:

- [ ] **Tool Name**: Exact function name (e.g., `checkAvailability`)
- [ ] **URL**: Complete Supabase function URL
- [ ] **Method**: `POST`
- [ ] **Header 1**: `Authorization: Bearer [KEY]`
- [ ] **Header 2**: `Content-Type: application/json`
- [ ] **Request Body**: Paste the JSON schema for that function
- [ ] **Encryption**: Leave default/empty
- [ ] **Response Body**: Optional, skip for now
- [ ] **Aliases**: Leave empty for now
- [ ] **Save**: Click Save/Update after each function

---

## Tips

1. **Copy-Paste Ready**: All JSON schemas above are ready to copy and paste directly
2. **Date Format**: Always use `DD-MM-YYYY` format (e.g., `25-12-2024`)
3. **Time Format**: Use 24-hour format (e.g., `14:00` for 2 PM)
4. **Authorization**: Make sure "Bearer " has a space after it
5. **Test First**: After adding, test one function before adding the rest

---

## Need the Full Tool Definitions?

If you need the complete JSON for all functions in one file, see `vapi-tool-definitions.json` in your project root.

---

## After Configuration

1. ✅ Save your assistant
2. ✅ Test each function (if Vapi has a test button)
3. ✅ Add system message (see `VAPI_SYSTEM_PROMPT.md`)
4. ✅ Make a test phone call

You're all set! 🎉
