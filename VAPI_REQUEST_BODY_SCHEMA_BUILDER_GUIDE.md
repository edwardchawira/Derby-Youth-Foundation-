# How to Fill in Vapi Request Body Schema Builder

This guide shows you exactly how to use Vapi's schema builder to add properties for your functions.

## For `checkAvailability` Function

You need to add **4 properties** using the schema builder. Here's how to fill in each one:

---

### Property 1: `booking_date` (REQUIRED)

1. **Name:** `booking_date`
2. **Type:** Select `string` from dropdown
3. **Default Value:** Leave empty (this is required, no default)
4. **Description:** 
   ```
   The date for the booking in DD-MM-YYYY format. Example: '25-12-2024' for December 25th, 2024
   ```
5. **Enum Values:** Click "+ Add Value" but don't add anything (leave empty - dates vary)
6. **Required:** ✅ **Check this box** (this is required)
7. Click **"Apply"**

---

### Property 2: `booking_time`

1. **Name:** `booking_time`
2. **Type:** Select `string` from dropdown
3. **Default Value:** `09:00`
4. **Description:** 
   ```
   The start time for the booking in HH:MM format (24-hour). Example: '14:00' for 2 PM. Defaults to '09:00' if not provided.
   ```
5. **Enum Values:** Leave empty
6. **Required:** ❌ Leave unchecked
7. Click **"Apply"**

---

### Property 3: `session_hours`

1. **Name:** `session_hours`
2. **Type:** Select `number` from dropdown (not string!)
3. **Default Value:** `1`
4. **Description:** 
   ```
   Number of hours for the booking session. Defaults to 1 if not provided.
   ```
5. **Enum Values:** Leave empty
6. **Required:** ❌ Leave unchecked
7. Click **"Apply"**

---

### Property 4: `booking_type`

1. **Name:** `booking_type`
2. **Type:** Select `string` from dropdown
3. **Default Value:** `studio`
4. **Description:** 
   ```
   Type of booking: 'studio' for studio sessions or 'equipment' for equipment rental. Defaults to 'studio'.
   ```
5. **Enum Values:** 
   - Click **"+ Add Value"**
   - Enter: `studio`
   - Click **"+ Add Value"** again
   - Enter: `equipment`
6. **Required:** ❌ Leave unchecked
7. Click **"Apply"**

---

## After Adding All Properties

After you've added all 4 properties and clicked "Apply" for each:

1. You should see all 4 properties listed in the schema builder
2. Click **"Save"** or **"Apply"** at the bottom of the tool configuration
3. Make sure to save your assistant configuration

---

## Quick Reference Table

| Property Name | Type | Default Value | Required? | Enum Values | Description |
|--------------|------|---------------|-----------|-------------|-------------|
| `booking_date` | `string` | (empty) | ✅ Yes | None | The date for the booking in DD-MM-YYYY format. Example: '25-12-2024' |
| `booking_time` | `string` | `09:00` | ❌ No | None | The start time in HH:MM format (24-hour). Example: '14:00' |
| `session_hours` | `number` | `1` | ❌ No | None | Number of hours for the booking session |
| `booking_type` | `string` | `studio` | ❌ No | `studio`, `equipment` | Type of booking: 'studio' or 'equipment' |

---

## For Other Functions

### `getAvailableSlots` - 3 Properties

| Property | Type | Default | Required? | Enum |
|----------|------|---------|-----------|------|
| `booking_date` | `string` | - | ✅ Yes | - |
| `booking_type` | `string` | `studio` | ❌ No | `studio`, `equipment` |
| `session_hours` | `number` | `1` | ❌ No | - |

### `createBooking` - 9 Properties

| Property | Type | Default | Required? | Enum |
|----------|------|---------|-----------|------|
| `customer_name` | `string` | - | ✅ Yes | - |
| `customer_email` | `string` | - | ✅ Yes | - |
| `customer_phone` | `string` | - | ❌ No | - |
| `booking_date` | `string` | - | ✅ Yes | - |
| `booking_time` | `string` | `09:00` | ❌ No | - |
| `session_hours` | `number` | `1` | ❌ No | - |
| `booking_type` | `string` | `studio` | ✅ Yes | `studio`, `equipment` |
| `package_name` | `string` | - | ❌ No | - |
| `package_price` | `number` | - | ❌ No | - |
| `special_requests` | `string` | - | ❌ No | - |

### `listBookings` - 5 Properties

| Property | Type | Default | Required? | Enum |
|----------|------|---------|-----------|------|
| `customer_email` | `string` | - | ❌ No* | - |
| `customer_phone` | `string` | - | ❌ No* | - |
| `booking_type` | `string` | - | ❌ No | `studio`, `equipment` |
| `date_from` | `string` | - | ❌ No | - |
| `date_to` | `string` | - | ❌ No | - |

*Note: At least one of `customer_email` or `customer_phone` should be provided (but Vapi may not enforce this, so you can leave both as optional)

### `updateBooking` - 8 Properties

| Property | Type | Default | Required? | Enum |
|----------|------|---------|-----------|------|
| `booking_id` | `string` | - | ✅ Yes | - |
| `booking_type` | `string` | `studio` | ❌ No | `studio`, `equipment` |
| `action` | `string` | `update` | ❌ No | `update`, `cancel` |
| `customer_email` | `string` | - | ❌ No | - |
| `new_booking_date` | `string` | - | ❌ No | - |
| `new_booking_time` | `string` | - | ❌ No | - |
| `new_session_hours` | `integer` | - | ❌ No | - |
| `new_special_requests` | `string` | - | ❌ No | - |

---

## Tips for Schema Builder

1. **Add One Property at a Time**: Complete each property fully before adding the next
2. **Click Apply After Each**: Don't forget to click "Apply" after configuring each property
3. **Type Matters**: Make sure to select the correct type (`string`, `number`, `boolean`, `object`, `array`)
4. **Enum Values**: Only add enum values if the property has a fixed set of options
5. **Required Fields**: Check "Required" only for fields that are mandatory
6. **Descriptions are Important**: Good descriptions help the AI understand what to send

---

## Common Mistakes to Avoid

❌ **Don't:** Forget to click "Apply" after each property  
❌ **Don't:** Use `string` type for numbers (use `number` type instead)  
❌ **Don't:** Leave description empty (it helps the AI)  
❌ **Don't:** Add enum values when they're not needed  
✅ **Do:** Check "Required" only for mandatory fields  
✅ **Do:** Set default values when they're specified  
✅ **Do:** Save your configuration after adding all properties  

---

## Verification

After adding all properties, you should see:
- A list of all properties you've added
- Each property showing its type and whether it's required
- The ability to edit or delete properties

If something looks wrong, you can usually click on a property to edit it or delete and re-add it.

---

## Need Help?

If the schema builder looks different or you're stuck:
1. Look for an "Import JSON" or "Paste Schema" option (some Vapi versions allow this)
2. Check if there's a way to switch between "Visual Builder" and "JSON Editor"
3. Refer back to `vapi-tool-definitions.json` for the exact schema structure

Good luck! 🎉
