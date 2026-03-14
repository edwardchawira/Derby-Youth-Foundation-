# Fix Twilio "From" Number Error

## The Problem

**Error:** `Mismatch between the 'From' number +14155238886 and the account YOUR_TWILIO_ACCOUNT_SID`

This means the phone number `+14155238886` in your workflow doesn't belong to your Twilio account.

---

## Solution: Find Your Correct Twilio Number

### Step 1: Check Your Twilio Account

1. **Go to Twilio Console:** https://console.twilio.com/
2. **Log in** to your Twilio account
3. **Go to:** Phone Numbers → Manage → Active Numbers
4. **Find your active phone number(s)**
5. **Copy the phone number** (it will be in E.164 format like `+1XXXXXXXXXX`)

### Step 2: Update the Workflow in n8n

1. **Open n8n:** `http://192.168.4.114:5678/`
2. **Open your workflow:** "Cart Item Added - SMS Notification"
3. **Click on the "Send SMS via Twilio" node**
4. **Find the "From" field**
5. **Replace** `+14155238886` with **your actual Twilio number**
6. **Save the workflow**

---

## Alternative: Check Your Other Workflows

Since you have other workflows using Twilio (like "My workflow 2"), you can check what number they use:

1. **Open n8n**
2. **Open "My workflow 2"** (the one that sends WhatsApp)
3. **Click on the Twilio node**
4. **Check the "From" number** - this is likely your correct number!
5. **Use that same number** in your cart SMS workflow

---

## Quick Fix Steps

1. ✅ Find your Twilio phone number (from Twilio console or other workflow)
2. ✅ Open the cart SMS workflow in n8n
3. ✅ Click "Send SMS via Twilio" node
4. ✅ Update "From" field with your correct number
5. ✅ Save and test again

---

## If You Don't Have a Twilio Number

If you don't have a phone number in your Twilio account:

1. **Go to Twilio Console:** https://console.twilio.com/
2. **Phone Numbers → Buy a Number**
3. **Select:**
   - Country: United States (or your country)
   - Capabilities: SMS
4. **Purchase a number**
5. **Use that number** in your n8n workflow

---

## Test After Fixing

After updating the "From" number, test again:

```powershell
$webhookUrl = "http://192.168.4.114:5678/webhook/cart-item-added"
$testPayload = @{
    customerName = "Test Customer"
    customerPhone = "+447361971592"
    items = @(
        @{ name = "Studio Session"; quantity = 1; price = 50.00 }
    )
    total = 50.00
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $webhookUrl -Method POST -ContentType "application/json" -Body $testPayload
```

---

## Common Twilio Number Formats

- **US/Canada:** `+1XXXXXXXXXX` (11 digits total)
- **UK:** `+44XXXXXXXXXX` (starts with +44)
- **Other countries:** Check Twilio documentation

Make sure the number is in **E.164 format** (starts with `+` and country code).

---

**Once you update the "From" number, the workflow should work!** ✅
