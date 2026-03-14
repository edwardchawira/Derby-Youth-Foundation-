# Vapi Pricing Issue - Solution

## Problem

Vapi is giving inaccurate studio session prices because there's no tool to query pricing from the database.

## Solution

There are two options:

### Option 1: Quick Fix - Add Pricing to System Prompt

Add your actual pricing to the Vapi system prompt so the assistant knows the prices.

**Add this to your Vapi System Message:**

```
## Studio Session Pricing

- **Rehearsal Space:**
  - Per hour: £X.XX
  - 4-hour package: £X.XX
  - 8-hour package: £X.XX

- **Recording Studio:**
  - Per hour: £X.XX
  - 4-hour package: £X.XX
  - 8-hour package: £X.XX

[Replace X.XX with your actual prices from the studio_services table]
```

### Option 2: Better Fix - Create Pricing Tool (Recommended)

Create a `vapi-get-pricing` Edge Function that queries the `studio_services` table for accurate, up-to-date pricing.

**Benefits:**
- ✅ Always shows current prices from database
- ✅ Automatically updates if prices change
- ✅ More accurate than static prompt

**Would you like me to create this tool?**

---

## Current Database Structure

The `studio_services` table contains:
- `name` - Service name (e.g., "Rehearsal Space", "Recording Studio")
- `type` - "rehearsal" or "recording"
- `hourly_rate` - Price per hour
- `four_hour_rate` - 4-hour package price
- `eight_hour_rate` - 8-hour package price
- `description` - Service description
- `features` - What's included

---

## Next Steps

1. **For immediate fix:** Add pricing to system prompt (Option 1)
2. **For permanent solution:** Create `vapi-get-pricing` tool (Option 2)

Let me know which you prefer and I'll implement it!
