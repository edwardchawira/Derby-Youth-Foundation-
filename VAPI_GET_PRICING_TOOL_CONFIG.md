# Vapi getPricing Tool Configuration

Complete guide for adding the `getPricing` tool to your Vapi Assistant.

## Tool Information

### **Function Name:**
```
getPricing
```

### **Description:**
```
Get studio session pricing information. Use this when a customer asks about prices, rates, or costs for studio sessions (rehearsal space, recording studio, etc.). Returns accurate pricing from the database including hourly rates and package prices.
```

---

## Server Function Configuration

### **1. Server URL:**
```
https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-get-pricing
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

Click **"Use Schema Builder"** or **"Build Schema"** in Vapi, then add this property:

### **Root Object Type:**
- Type: `object`

### **Properties:**

#### **1. service_type** (Optional)
- **Type:** `string`
- **Description:** `Filter by service type: 'rehearsal' for rehearsal space pricing, 'recording' for recording studio pricing. Optional - if not provided, returns all pricing.`
- **Required:** ❌ No
- **Default:** None (returns all pricing)

**Example values:**
- `"rehearsal"` - Returns only rehearsal space pricing
- `"recording"` - Returns only recording studio pricing
- (empty) - Returns all pricing

---

## Complete Schema in JSON Format

If Vapi allows you to paste JSON directly, use this:

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

## Step-by-Step Configuration in Vapi

1. **Go to Vapi Dashboard** → Your Assistant → **Tools** tab

2. **Click "Add Tool"** or **"Add Server Function"**

3. **Fill in the form:**

   **Function Name:**
   ```
   getPricing
   ```

   **Description:**
   ```
   Get studio session pricing information. Use this when a customer asks about prices, rates, or costs for studio sessions (rehearsal space, recording studio, etc.). Returns accurate pricing from the database including hourly rates and package prices.
   ```

   **Server URL:**
   ```
   https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-get-pricing
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
     - Name: `service_type`
     - Type: `string`
     - Description: `Filter by service type: 'rehearsal' for rehearsal space pricing, 'recording' for recording studio pricing. Optional - if not provided, returns all pricing.`
     - Required: ❌ Unchecked

5. **Save** the tool configuration

---

## Example Request Body

The function accepts these request bodies:

**Get all pricing:**
```json
{}
```

**Get rehearsal space pricing only:**
```json
{
  "service_type": "rehearsal"
}
```

**Get recording studio pricing only:**
```json
{
  "service_type": "recording"
}
```

---

## Expected Response

The function returns:

```json
{
  "success": true,
  "pricing": [
    {
      "id": "uuid-here",
      "name": "Rehearsal Space",
      "type": "rehearsal",
      "hourly_rate": 25.00,
      "four_hour_rate": 90.00,
      "eight_hour_rate": 160.00,
      "description": "Professional rehearsal space with high-quality equipment",
      "features": ["Equipment included", "Sound system", "Air conditioning"],
      "savings": {
        "four_hour": {
          "amount": 10.00,
          "percentage": 10
        },
        "eight_hour": {
          "amount": 40.00,
          "percentage": 20
        }
      }
    },
    {
      "id": "uuid-here-2",
      "name": "Recording Studio",
      "type": "recording",
      "hourly_rate": 50.00,
      "four_hour_rate": 180.00,
      "eight_hour_rate": 320.00,
      "description": "Professional recording studio",
      "features": ["Full recording setup", "Mixing console", "Audio engineer"],
      "savings": {
        "four_hour": {
          "amount": 20.00,
          "percentage": 10
        },
        "eight_hour": {
          "amount": 80.00,
          "percentage": 20
        }
      }
    }
  ],
  "count": 2
}
```

---

## Testing the Tool

After adding the tool, test it:

1. **Deploy the Edge Function first:**
   ```bash
   supabase functions deploy vapi-get-pricing
   ```

2. **Test the function directly:**
   ```bash
   curl -X POST https://[YOUR-PROJECT-REF].supabase.co/functions/v1/vapi-get-pricing \
     -H "Authorization: Bearer [YOUR-ANON-KEY]" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

3. **Make a test phone call** to your Vapi number
4. **Ask:** "What are your studio session prices?"
5. **Or ask:** "How much does a rehearsal space cost per hour?"
6. **Or ask:** "What are your recording studio rates?"

The assistant should call the `getPricing` function and respond with accurate pricing from the database.

---

## Troubleshooting

### Tool not being called?
- Verify the tool name is exactly `getPricing` (case-sensitive)
- Check Server URL is correct
- Verify Authorization header is set correctly
- Check Vapi call logs to see if function is being invoked

### No pricing returned?
- Verify `studio_services` table has data in Supabase
- Check Supabase Edge Function logs for errors
- Test the function directly with curl (see above)

### Pricing data missing?
- Check `studio_services` table has rows
- Verify `hourly_rate`, `four_hour_rate`, `eight_hour_rate` columns have data
- Run this SQL in Supabase to check:
  ```sql
  SELECT name, type, hourly_rate, four_hour_rate, eight_hour_rate 
  FROM studio_services;
  ```

### Error messages?
- Check Supabase Edge Function logs
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in Edge Function environment variables
- Ensure `studio_services` table exists and has RLS policies configured

---

## What This Tool Solves

✅ **Accurate Pricing:** Always shows current prices from database  
✅ **Automatic Updates:** Prices update automatically when changed in database  
✅ **Package Pricing:** Shows hourly, 4-hour, and 8-hour package prices  
✅ **Savings Calculation:** Automatically calculates and shows savings for packages  
✅ **Service Filtering:** Can filter by rehearsal or recording studio types  

---

## Next Steps

1. ✅ Deploy the Edge Function:
   ```bash
   supabase functions deploy vapi-get-pricing
   ```

2. ✅ Add the tool to Vapi (follow steps above)

3. ✅ Test with a phone call

4. ✅ Verify pricing is accurate

---

**That's it!** Once configured, your Vapi assistant can provide accurate, up-to-date pricing from your database! 🎉
