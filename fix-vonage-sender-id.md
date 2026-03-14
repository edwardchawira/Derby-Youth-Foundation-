# Fix: Vonage SMS Not Sending - Sender ID Issue

## Problem
The workflow is failing at the "Send SMS via Vonage" node because the "From" field is set to `PinnacleSSA`, which is likely not a registered sender ID in Vonage.

## Solution Options

### Option 1: Use Your Vonage Phone Number (Recommended)

1. **Get your Vonage number:**
   - Log into: https://dashboard.nexmo.com/
   - Go to **Numbers** → **Your Numbers**
   - Copy one of your Vonage phone numbers (format: `447700900000`)

2. **Update the workflow:**
   - Open n8n: http://192.168.4.114:5678
   - Open the workflow: "Cart Item Added - SMS Notification (Vonage)"
   - Click on **"Format SMS Message"** node
   - Update the code to use your Vonage number:

```javascript
return {
  json: {
    from: '447700900000', // Replace with YOUR Vonage number
    to: formatPhoneForVonage(customerPhone),
    message: message,
    customerName: customerName,
    itemCount: items.length,
    total: total,
    items: items
  }
};
```

3. **Or update the Vonage node directly:**
   - Click on **"Send SMS via Vonage"** node
   - In the **"From"** field, enter your Vonage number (e.g., `447700900000`)
   - Save the workflow

### Option 2: Register Sender ID "PinnacleSSA"

1. **Register in Vonage Dashboard:**
   - Go to: https://dashboard.nexmo.com/
   - Navigate to **Settings** → **Sender IDs**
   - Click **"Add Sender ID"**
   - Enter: `PinnacleSSA`
   - Submit for approval
   - Wait for approval (can take 24-48 hours)

2. **Once approved, the workflow will work with "PinnacleSSA"**

### Option 3: Use a Different Sender ID

If you have other approved sender IDs, use one of those instead.

---

## Quick Fix Script

I can update the workflow to use a Vonage number. **Please provide your Vonage phone number** and I'll update the workflow automatically.

Or you can manually update it in n8n:
1. Open the workflow
2. Click "Format SMS Message" node
3. Change `from: 'PinnacleSSA'` to `from: 'YOUR_VONAGE_NUMBER'`
4. Save and test

---

## Common Vonage Errors

- **"Invalid sender ID"** → Use a registered Vonage number or approved sender ID
- **"Insufficient credits"** → Add credits to your Vonage account
- **"Number not verified"** → Verify your Vonage number in the dashboard
