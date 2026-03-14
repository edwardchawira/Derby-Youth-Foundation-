# Manual VAPI Tool Update Guide - Field by Field

This guide shows you how to manually update each property in each tool, one field at a time.

---

## 🔧 General Setup (Do This First)

1. Go to **VAPI Dashboard** → Your Assistant → **Tools** tab
2. For each tool, you'll need to set:
   - **Server URL**
   - **Method: POST**
   - **Authorization Header**
   - **Request Body Schema** (we'll build this field by field)

---

## 📋 Tool 1: `checkAvailability`

### Step 1: Basic Configuration
1. Find or create tool: `checkAvailability`
2. **Server URL:** `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-check-availability`
3. **Method:** `POST`
4. **Authorization Header:**
   - Name: `Authorization`
   - Value: `Bearer [YOUR-SUPABASE-ANON-KEY]`

### Step 2: Build Request Body Schema

Click **"Build Schema"** or **"Add Parameter"** and add these properties one by one:

#### Property 1: `booking_date`
- **Name:** `booking_date`
- **Type:** `string`
- **Description:** `The date for the booking in DD-MM-YYYY format. Example: '25-12-2026' for December 25th, 2026. Current year is 2026.`
- **Pattern/Format:** `^\d{2}-\d{2}-\d{4}$`
- **Required:** ✅ Yes

#### Property 2: `booking_time`
- **Name:** `booking_time`
- **Type:** `string`
- **Description:** `The start time for the booking in HH:MM format (24-hour). Example: '14:00' for 2 PM. Defaults to '09:00' if not provided.`
- **Pattern/Format:** `^([0-1][0-9]|2[0-3]):[0-5][0-9]$`
- **Required:** ❌ No

#### Property 3: `session_hours`
- **Name:** `session_hours`
- **Type:** `integer`
- **Description:** `Number of hours for the booking session. Defaults to 1 if not provided.`
- **Minimum:** `1`
- **Maximum:** `12`
- **Required:** ❌ No

#### Property 4: `booking_type`
- **Name:** `booking_type`
- **Type:** `string`
- **Description:** `Type of booking: 'studio' for studio sessions or 'equipment' for equipment rental. Defaults to 'studio'.`
- **Enum/Allowed Values:** 
  - `studio`
  - `equipment`
- **Required:** ❌ No

**Save the tool!**

---

## 📋 Tool 2: `getAvailableSlots`

### Step 1: Basic Configuration
- **Function Name:** `getAvailableSlots`
- **Server URL:** `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-get-available-slots`
- **Method:** `POST`
- **Authorization:** `Bearer [YOUR-ANON-KEY]`

### Step 2: Request Body Schema Properties

#### Property 1: `booking_date`
- **Name:** `booking_date`
- **Type:** `string`
- **Description:** `The date to check availability for in DD-MM-YYYY format. Example: '25-12-2024' for December 25th, 2024`
- **Pattern:** `^\d{2}-\d{2}-\d{4}$`
- **Required:** ✅ Yes

#### Property 2: `booking_type`
- **Name:** `booking_type`
- **Type:** `string`
- **Description:** `Type of booking: 'studio' for studio sessions or 'equipment' for equipment rental. Defaults to 'studio'.`
- **Enum:** `studio`, `equipment`
- **Required:** ❌ No

#### Property 3: `session_hours`
- **Name:** `session_hours`
- **Type:** `integer`
- **Description:** `Number of hours needed for the session. Used to find slots that can accommodate this duration. Defaults to 1.`
- **Minimum:** `1`
- **Maximum:** `12`
- **Required:** ❌ No

**Save the tool!**

---

## 📋 Tool 3: `createBooking` ⭐ (MOST IMPORTANT - UPDATED)

### Step 1: Basic Configuration
- **Function Name:** `createBooking`
- **Server URL:** `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-create-booking`
- **Method:** `POST`
- **Authorization:** `Bearer [YOUR-ANON-KEY]`

### Step 2: Request Body Schema Properties

#### Property 1: `customer_name`
- **Name:** `customer_name`
- **Type:** `string`
- **Description:** `Full name of the customer making the booking`
- **Required:** ✅ Yes

#### Property 2: `customer_email`
- **Name:** `customer_email`
- **Type:** `string`
- **Format:** `email`
- **Description:** `Email address of the customer. Used for booking confirmation.`
- **Required:** ✅ Yes

#### Property 3: `customer_phone`
- **Name:** `customer_phone`
- **Type:** `string`
- **Description:** `Phone number of the customer. Include country code if available. Example: '+1234567890'`
- **Required:** ❌ No

#### Property 4: `booking_date`
- **Name:** `booking_date`
- **Type:** `string`
- **Description:** `Date of the booking in DD-MM-YYYY format. Example: '25-12-2026' for December 25th, 2026. Current year is 2026.`
- **Pattern:** `^\d{2}-\d{2}-\d{4}$`
- **Required:** ✅ Yes

#### Property 5: `booking_time`
- **Name:** `booking_time`
- **Type:** `string`
- **Description:** `Time in HH:MM format (24-hour). For studio bookings: session start time (e.g., '14:00' for 2 PM). For equipment bookings: collection time. Required for studio bookings, recommended for equipment bookings.`
- **Pattern:** `^([0-1][0-9]|2[0-3]):[0-5][0-9]$`
- **Required:** ❌ No

#### Property 6: `session_hours`
- **Name:** `session_hours`
- **Type:** `integer`
- **Description:** `Number of hours for studio session bookings. Not used for equipment rentals (use duration_days instead).`
- **Minimum:** `1`
- **Maximum:** `12`
- **Default:** `1`
- **Required:** ❌ No

#### Property 7: `duration_days` ⭐ NEW
- **Name:** `duration_days`
- **Type:** `integer`
- **Description:** `Number of days for equipment rental. Required for equipment bookings. Example: 1 for one day, 3 for three days.`
- **Minimum:** `1`
- **Maximum:** `30`
- **Required:** ❌ No (but required for equipment bookings)

#### Property 8: `booking_type`
- **Name:** `booking_type`
- **Type:** `string`
- **Description:** `Type of booking: 'studio' for studio sessions or 'equipment' for equipment rental`
- **Enum:** 
  - `studio`
  - `equipment`
- **Required:** ✅ Yes

#### Property 9: `package_name`
- **Name:** `package_name`
- **Type:** `string`
- **Description:** `Name of the package or service. For studio: 'Rehearsal Space', 'Recording Studio', etc. For equipment: package name if applicable.`
- **Required:** ❌ No

#### Property 10: `package_price`
- **Name:** `package_price`
- **Type:** `number`
- **Description:** `Price of the booking in your currency (e.g., 50.00 for £50). For equipment bookings, this should be the total price including all items.`
- **Required:** ❌ No

#### Property 11: `equipment_items` ⭐ NEW - This is an ARRAY
- **Name:** `equipment_items`
- **Type:** `array`
- **Description:** `Array of equipment items being rented. Required for equipment bookings. Each item must include name, quantity, price (per day), and optionally duration (days).`
- **Required:** ❌ No (but required for equipment bookings)

**Now you need to define what's INSIDE the array:**

Click on `equipment_items` → **"Edit Items"** or **"Array Item Schema"** and add:

##### Array Item Properties (inside equipment_items):

**Item Property 1: `id`**
- **Name:** `id`
- **Type:** `string`
- **Description:** `Equipment item ID from the equipment list`
- **Required:** ❌ No

**Item Property 2: `name`**
- **Name:** `name`
- **Type:** `string`
- **Description:** `Name of the equipment item (e.g., 'Drum Kit', 'Microphone', 'Keyboard')`
- **Required:** ✅ Yes

**Item Property 3: `quantity`**
- **Name:** `quantity`
- **Type:** `integer`
- **Description:** `Number of units of this equipment item`
- **Minimum:** `1`
- **Required:** ✅ Yes

**Item Property 4: `price`**
- **Name:** `price`
- **Type:** `number`
- **Description:** `Price per day for this equipment item`
- **Required:** ✅ Yes

**Item Property 5: `duration`**
- **Name:** `duration`
- **Type:** `integer`
- **Description:** `Number of days to rent this item (defaults to duration_days if not specified)`
- **Minimum:** `1`
- **Required:** ❌ No

#### Property 12: `special_requests`
- **Name:** `special_requests`
- **Type:** `string`
- **Description:** `Any special requests or notes from the customer. Optional.`
- **Required:** ❌ No

**Save the tool!**

---

## 📋 Tool 4: `listBookings`

### Step 1: Basic Configuration
- **Function Name:** `listBookings`
- **Server URL:** `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-list-bookings`
- **Method:** `POST`
- **Authorization:** `Bearer [YOUR-ANON-KEY]`

### Step 2: Request Body Schema Properties

#### Property 1: `customer_email`
- **Name:** `customer_email`
- **Type:** `string`
- **Format:** `email`
- **Description:** `Email address of the customer to search for bookings`
- **Required:** ❌ No

#### Property 2: `customer_phone`
- **Name:** `customer_phone`
- **Type:** `string`
- **Description:** `Phone number of the customer to search for bookings. Include country code if available.`
- **Required:** ❌ No

#### Property 3: `booking_type`
- **Name:** `booking_type`
- **Type:** `string`
- **Description:** `Filter by booking type: 'studio', 'equipment', or omit to get all types`
- **Enum:** `studio`, `equipment`
- **Required:** ❌ No

#### Property 4: `date_from`
- **Name:** `date_from`
- **Type:** `string`
- **Description:** `Filter bookings from this date in DD-MM-YYYY format (e.g., '01-12-2024'). Optional, defaults to today if not provided.`
- **Pattern:** `^\d{2}-\d{2}-\d{4}$`
- **Required:** ❌ No

#### Property 5: `date_to`
- **Name:** `date_to`
- **Type:** `string`
- **Description:** `Filter bookings up to this date in DD-MM-YYYY format (e.g., '31-12-2026'). Optional. Current year is 2026.`
- **Pattern:** `^\d{2}-\d{2}-\d{4}$`
- **Required:** ❌ No

**Save the tool!**

---

## 📋 Tool 5: `listEquipment`

### Step 1: Basic Configuration
- **Function Name:** `listEquipment`
- **Server URL:** `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-list-equipment`
- **Method:** `POST`
- **Authorization:** `Bearer [YOUR-ANON-KEY]`

### Step 2: Request Body Schema Properties

#### Property 1: `category`
- **Name:** `category`
- **Type:** `string`
- **Description:** `Filter by equipment category (e.g., 'Sound Equipment', 'Keyboards', 'Drums', 'Microphones'). Optional.`
- **Required:** ❌ No

#### Property 2: `search`
- **Name:** `search`
- **Type:** `string`
- **Description:** `Search for equipment by name or description. Example: 'microphone', 'drum kit', 'keyboard'. Optional.`
- **Required:** ❌ No

#### Property 3: `available_only`
- **Name:** `available_only`
- **Type:** `boolean`
- **Description:** `Only show available equipment (default: true). Set to false to show all equipment including unavailable items.`
- **Default:** `true`
- **Required:** ❌ No

**Save the tool!**

---

## 📋 Tool 6: `getPricing`

### Step 1: Basic Configuration
- **Function Name:** `getPricing`
- **Server URL:** `https://dxfukbncszjdwyqhmrgq.supabase.co/functions/v1/vapi-get-pricing`
- **Method:** `POST`
- **Authorization:** `Bearer [YOUR-ANON-KEY]`

### Step 2: Request Body Schema Properties

#### Property 1: `service_type`
- **Name:** `service_type`
- **Type:** `string`
- **Description:** `Filter by service type: 'rehearsal' for rehearsal space pricing, 'recording' for recording studio pricing. Optional - if not provided, returns all pricing.`
- **Required:** ❌ No

**Save the tool!**

---

## ✅ Final Checklist

After updating each tool, verify:

- [ ] All 6 tools are updated
- [ ] `createBooking` has the new `equipment_items` array property
- [ ] `createBooking` has the new `duration_days` property
- [ ] All Server URLs are correct
- [ ] All methods are set to `POST`
- [ ] All Authorization headers are set
- [ ] All required fields are marked correctly
- [ ] All tools are saved

---

## 🎯 Most Important: `createBooking` Tool

Make sure `createBooking` includes:
- ✅ `equipment_items` (array with nested properties)
- ✅ `duration_days` (integer, 1-30)
- ✅ All other existing properties

This is critical for capturing equipment booking information!

---

## 💡 Tips

1. **For Arrays:** When adding `equipment_items`, look for an "Edit Items" or "Array Item Schema" button to define what's inside the array
2. **For Enums:** When adding `booking_type`, look for "Allowed Values" or "Enum" option to add `studio` and `equipment`
3. **For Patterns:** Some fields have "Pattern" or "Format" - paste the regex pattern exactly
4. **Save Frequently:** Save after each tool to avoid losing work

Good luck! 🚀
