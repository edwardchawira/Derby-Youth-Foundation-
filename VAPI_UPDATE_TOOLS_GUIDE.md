# Complete Guide: Updating All VAPI Tools Using JSON

## 📋 Overview

This guide walks you through updating all your VAPI tools using the `vapi-tool-definitions.json` file. You'll update each tool's schema while adding the server URLs and authorization.

---

## 🔧 Prerequisites

Before starting, gather this information:

1. **Your Supabase Project Reference:** `dxfukbncszjdwyqhmrgq`
2. **Your Supabase Anon Key:** Get from Supabase Dashboard → Settings → API → `anon` `public` key
3. **Base URL:** `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/`

---

## 📝 Step-by-Step: Update Each Tool

### Tool 1: `checkAvailability`

1. **In VAPI Dashboard:**
   - Go to **Tools** tab
   - Find or create tool named: `checkAvailability`

2. **Function Name:**
   ```
   checkAvailability
   ```

3. **Description:**
   ```
   Check if a specific time slot is available for booking. Use this before creating a booking to prevent conflicts. Returns whether the slot is available and any existing conflicts.
   ```

4. **Server URL:**
   ```
   https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-check-availability
   ```

5. **Method:** `POST`

6. **Authorization Header:**
   - Name: `Authorization`
   - Value: `Bearer [YOUR-SUPABASE-ANON-KEY]`

7. **Request Body Schema:**
   - Click **"Build Schema"** or **"Use JSON Schema"**
   - Copy and paste this JSON:

```json
{
  "type": "object",
  "properties": {
    "booking_date": {
      "type": "string",
      "description": "The date for the booking in DD-MM-YYYY format. Example: '25-12-2026' for December 25th, 2026. Current year is 2026.",
      "pattern": "^\\d{2}-\\d{2}-\\d{4}$"
    },
    "booking_time": {
      "type": "string",
      "description": "The start time for the booking in HH:MM format (24-hour). Example: '14:00' for 2 PM. Defaults to '09:00' if not provided.",
      "pattern": "^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
    },
    "session_hours": {
      "type": "integer",
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

8. **Click Save**

---

### Tool 2: `getAvailableSlots`

1. **Function Name:**
   ```
   getAvailableSlots
   ```

2. **Description:**
   ```
   Get all available time slots for a specific date. Use this when a customer asks what times are available or wants to see their options.
   ```

3. **Server URL:**
   ```
   https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-get-available-slots
   ```

4. **Method:** `POST`

5. **Authorization:** `Bearer [YOUR-ANON-KEY]`

6. **Request Body Schema:**
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

### Tool 3: `createBooking` ⭐ (UPDATED - Most Important!)

1. **Function Name:**
   ```
   createBooking
   ```

2. **Description:**
   ```
   Create a new booking. Automatically checks for conflicts before creating. Use this after confirming availability and collecting customer information. Returns booking confirmation with booking ID.
   ```

3. **Server URL:**
   ```
   https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-create-booking
   ```

4. **Method:** `POST`

5. **Authorization:** `Bearer [YOUR-ANON-KEY]`

6. **Request Body Schema:**
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
      "description": "Date of the booking in DD-MM-YYYY format. Example: '25-12-2026' for December 25th, 2026. Current year is 2026.",
      "pattern": "^\\d{2}-\\d{2}-\\d{4}$"
    },
    "booking_time": {
      "type": "string",
      "description": "Time in HH:MM format (24-hour). For studio bookings: session start time (e.g., '14:00' for 2 PM). For equipment bookings: collection time. Required for studio bookings, recommended for equipment bookings.",
      "pattern": "^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
    },
    "session_hours": {
      "type": "integer",
      "description": "Number of hours for studio session bookings. Not used for equipment rentals (use duration_days instead).",
      "minimum": 1,
      "maximum": 12,
      "default": 1
    },
    "duration_days": {
      "type": "integer",
      "description": "Number of days for equipment rental. Required for equipment bookings. Example: 1 for one day, 3 for three days.",
      "minimum": 1,
      "maximum": 30
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
      "description": "Price of the booking in your currency (e.g., 50.00 for £50). For equipment bookings, this should be the total price including all items."
    },
    "equipment_items": {
      "type": "array",
      "description": "Array of equipment items being rented. Required for equipment bookings. Each item must include name, quantity, price (per day), and optionally duration (days).",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Equipment item ID from the equipment list"
          },
          "name": {
            "type": "string",
            "description": "Name of the equipment item (e.g., 'Drum Kit', 'Microphone', 'Keyboard')"
          },
          "quantity": {
            "type": "integer",
            "description": "Number of units of this equipment item",
            "minimum": 1
          },
          "price": {
            "type": "number",
            "description": "Price per day for this equipment item"
          },
          "duration": {
            "type": "integer",
            "description": "Number of days to rent this item (defaults to duration_days if not specified)",
            "minimum": 1
          }
        },
        "required": ["name", "quantity", "price"]
      }
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

### Tool 4: `listBookings`

1. **Function Name:** `listBookings`
2. **Server URL:** `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-list-bookings`
3. **Method:** `POST`
4. **Authorization:** `Bearer [YOUR-ANON-KEY]`
5. **Request Body Schema:**
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
      "description": "Filter bookings up to this date in DD-MM-YYYY format (e.g., '31-12-2026'). Optional. Current year is 2026.",
      "pattern": "^\\d{2}-\\d{2}-\\d{4}$"
    }
  },
  "required": []
}
```

---

### Tool 5: `listEquipment`

1. **Function Name:** `listEquipment`
2. **Server URL:** `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-list-equipment`
3. **Method:** `POST`
4. **Authorization:** `Bearer [YOUR-ANON-KEY]`
5. **Request Body Schema:**
```json
{
  "type": "object",
  "properties": {
    "category": {
      "type": "string",
      "description": "Filter by equipment category (e.g., 'Sound Equipment', 'Keyboards', 'Drums', 'Microphones'). Optional."
    },
    "search": {
      "type": "string",
      "description": "Search for equipment by name or description. Example: 'microphone', 'drum kit', 'keyboard'. Optional."
    },
    "available_only": {
      "type": "boolean",
      "description": "Only show available equipment (default: true). Set to false to show all equipment including unavailable items.",
      "default": true
    }
  },
  "required": []
}
```

---

### Tool 6: `getPricing`

1. **Function Name:** `getPricing`
2. **Server URL:** `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-get-pricing`
3. **Method:** `POST`
4. **Authorization:** `Bearer [YOUR-ANON-KEY]`
5. **Request Body Schema:**
```json
{
  "type": "object",
  "properties": {
    "service_type": {
      "type": "string",
      "description": "Filter by service type: 'rehearsal' for rehearsal space pricing, 'recording' for recording studio pricing. Optional - if not provided, returns all pricing."
    }
  },
  "required": []
}
```

---

## ✅ Quick Checklist

After updating each tool, verify:

- [ ] Function name matches exactly (case-sensitive)
- [ ] Server URL includes `/functions/v1/vapi-[name]`
- [ ] Method is set to **POST**
- [ ] Authorization header is set: `Bearer [YOUR-ANON-KEY]`
- [ ] Request Body Schema is pasted correctly
- [ ] All required fields are marked
- [ ] Tool is saved

---

## 🚨 Important Notes

1. **Method MUST be POST** - All tools require POST method
2. **Authorization is Required** - Use your Supabase `anon` key (NOT service_role)
3. **URL Format** - Must include `/functions/v1/` in the path
4. **Case Sensitive** - Function names must match exactly

---

## 🧪 Testing After Update

After updating all tools:

1. Make a test call through VAPI
2. Try creating an equipment booking
3. Check Supabase Edge Function logs to see if tools are being called
4. Verify the booking appears in your admin panel with all details

---

## 📞 Need Help?

If a tool doesn't work:
1. Check Supabase Edge Functions → Logs for errors
2. Verify the function is deployed
3. Verify environment variables are set
4. Check the Server URL matches the deployed function name exactly
