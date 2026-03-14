# Vapi listEquipment Tool Configuration

Complete guide for adding the `listEquipment` tool to your Vapi Assistant.

## Tool Information

### **Function Name:**
```
listEquipment
```

### **Description:**
```
List available equipment items for rental. Use this when a customer asks about what equipment is available, wants to rent equipment, or asks about equipment prices.
```

---

## Server Function Configuration

### **1. Server URL:**
```
https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-list-equipment
```
Replace `[YOUR-PROJECT-REF]` with your Supabase project reference (e.g., `dxfukbncszjdwyqhmrgq`).

### **2. Method:**
```
POST
```

### **3. Authorization Header:**
```
Bearer [YOUR-SUPABASE-ANON-KEY]
```
Replace `[YOUR-SUPABASE-ANON-KEY]` with your Supabase anonymous key from Dashboard → Settings → API.

---

## Request Body Schema

Click **"Use Schema Builder"** or **"Build Schema"** in Vapi, then add these properties:

### **Root Object Type:**
- Type: `object`

### **Properties:**

#### **1. category**
- **Type:** `string`
- **Description:** `Filter by equipment category (e.g., 'Sound Equipment', 'Keyboards', 'Drums', 'Microphones'). Optional.`
- **Required:** ❌ No
- **Default:** None

**Example values:**
- `"Sound Equipment"`
- `"Keyboards"`
- `"Drums"`
- `"Microphones"`

---

#### **2. search**
- **Type:** `string`
- **Description:** `Search for equipment by name or description. Example: 'microphone', 'drum kit', 'keyboard'. Optional.`
- **Required:** ❌ No
- **Default:** None

**Example values:**
- `"microphone"`
- `"drum kit"`
- `"keyboard"`
- `"wireless mic"`

---

#### **3. available_only**
- **Type:** `boolean`
- **Description:** `Only show available equipment (default: true). Set to false to show all equipment including unavailable items.`
- **Required:** ❌ No
- **Default:** `true`

**Possible values:**
- `true` (show only available items)
- `false` (show all items)

---

## Complete Schema in JSON Format

If Vapi allows you to paste JSON directly, use this:

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

## Step-by-Step Configuration in Vapi

1. **Go to Vapi Dashboard** → Your Assistant → **Tools** tab

2. **Click "Add Tool"** or **"Add Server Function"**

3. **Fill in the form:**

   **Function Name:**
   ```
   listEquipment
   ```

   **Description:**
   ```
   List available equipment items for rental. Use this when a customer asks about what equipment is available, wants to rent equipment, or asks about equipment prices.
   ```

   **Server URL:**
   ```
   https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-list-equipment
   ```

   **Method:**
   ```
   POST
   ```

   **Authorization:**
   - Type: `Bearer Token` or `Header`
   - Key: `Authorization`
   - Value: `Bearer [YOUR-SUPABASE-ANON-KEY]`

4. **Request Body Schema:**
   
   Click **"Build Schema"** or **"Use Schema Builder"**, then:
   
   - **Root type:** Select `object`
   
   - **Add property 1:**
     - Name: `category`
     - Type: `string`
     - Description: `Filter by equipment category (e.g., 'Sound Equipment', 'Keyboards', 'Drums', 'Microphones'). Optional.`
     - Required: ❌ Unchecked
   
   - **Add property 2:**
     - Name: `search`
     - Type: `string`
     - Description: `Search for equipment by name or description. Example: 'microphone', 'drum kit', 'keyboard'. Optional.`
     - Required: ❌ Unchecked
   
   - **Add property 3:**
     - Name: `available_only`
     - Type: `boolean`
     - Description: `Only show available equipment (default: true). Set to false to show all equipment including unavailable items.`
     - Required: ❌ Unchecked
     - Default: `true`

5. **Save** the tool configuration

---

## Example Request Body

The function accepts these request bodies:

**Get all available equipment:**
```json
{}
```

**Get all equipment (including unavailable):**
```json
{
  "available_only": false
}
```

**Search for microphones:**
```json
{
  "search": "microphone"
}
```

**Filter by category:**
```json
{
  "category": "Keyboards"
}
```

**Search in a specific category:**
```json
{
  "category": "Sound Equipment",
  "search": "wireless"
}
```

---

## Expected Response

The function returns:

```json
{
  "success": true,
  "equipment": [
    {
      "id": "uuid-here",
      "name": "Shure SLXD Wireless Mic",
      "description": "Professional wireless microphone system",
      "price_per_day": 40,
      "available": true,
      "category": "Microphones"
    },
    // ... more items
  ],
  "count": 5
}
```

---

## Testing the Tool

After adding the tool, test it:

1. **Make a test phone call** to your Vapi number
2. **Ask:** "What equipment do you have available?"
3. **Or ask:** "Do you have any microphones?"
4. **Or ask:** "What keyboards are available?"

The assistant should call the `listEquipment` function and respond with available equipment.

---

## Troubleshooting

### Tool not being called?
- Verify the tool name is exactly `listEquipment` (case-sensitive)
- Check Server URL is correct
- Verify Authorization header is set correctly
- Check Vapi call logs to see if function is being invoked

### No equipment returned?
- Verify `equipment_items` table has data in Supabase
- Check Supabase Edge Function logs for errors
- Test the function directly with curl:

```bash
curl -X POST https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-list-equipment \
  -H "Authorization: Bearer [YOUR-ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Error messages?
- Check Supabase Edge Function logs
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in Edge Function environment variables
- Ensure `equipment_items` table exists and has RLS policies configured

---

**That's it!** Once configured, your Vapi assistant can list and search equipment for customers. 🎉
