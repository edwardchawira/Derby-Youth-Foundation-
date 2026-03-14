# Vonage SMS Workflow Setup Guide

## Overview

This guide shows you how to set up the cart SMS notification workflow using **Vonage** instead of Twilio.

---

## Step 1: Get Your Vonage Credentials

### 1.1 Access Vonage Dashboard

1. Go to: https://dashboard.nexmo.com/ (Vonage Dashboard)
2. Log in to your Vonage account
3. Navigate to **Settings** → **API Credentials**

### 1.2 Get API Key and Secret

You'll need:
- **API Key** (looks like: `abc12345`)
- **API Secret** (looks like: `xyz67890`)

**Note:** These are different from Twilio's Account SID and Auth Token.

---

## Step 2: Set Up Vonage Credentials in n8n

1. **Open n8n:** `http://192.168.4.114:5678/`
2. **Go to:** Settings → Credentials (or click the credentials icon)
3. **Click:** "+ New Credential"
4. **Search for:** "Vonage"
5. **Select:** "Vonage API"
6. **Enter:**
   - **API Key:** Your Vonage API Key
   - **API Secret:** Your Vonage API Secret
7. **Name it:** "Vonage account" (or your preferred name)
8. **Save** the credentials

---

## Step 3: Import the Vonage Workflow

### Option A: Import New Workflow

1. **Open n8n:** `http://192.168.4.114:5678/`
2. **Go to:** Workflows
3. **Click:** "+" → "Import from File"
4. **Select:** `n8n-cart-sms-workflow-vonage.json`
5. **Workflow imported!**

### Option B: Update Existing Workflow

If you already have the Twilio workflow:

1. **Open** your "Cart Item Added - SMS Notification" workflow
2. **Delete** the "Send SMS via Twilio" node
3. **Add** a new node: Search for "Vonage"
4. **Select:** "Vonage" node
5. **Configure:**
   - **Operation:** `Send SMS`
   - **From:** `PinnacleSSA` (your Vonage sender ID) or your Vonage number
   - **To:** `={{ $json.to }}`
   - **Text:** `={{ $json.message }}`
6. **Connect** your Vonage credentials
7. **Connect** the nodes: Format SMS Message → Send SMS via Vonage → Respond to Webhook

---

## Step 4: Configure Vonage Node

### 4.1 Update the Code Node

The code node has been updated to format phone numbers for Vonage (removes `+`, spaces, and leading zeros).

**Current format:**
- Input: `+447361971592`
- Output: `447361971592`

### 4.2 Set Your Sender ID

In the Vonage node, set the **"From"** field:

**Option 1: Use Sender ID (Text)**
- Value: `PinnacleSSA` (or your brand name)
- **Note:** Sender ID must be registered with Vonage

**Option 2: Use Vonage Number**
- Value: Your Vonage phone number (e.g., `447700900000`)
- Format: No `+`, no spaces, no leading zeros

**To find your Vonage number:**
1. Go to Vonage Dashboard → Numbers
2. Find your active number
3. Copy it (format: `447700900000`)

---

## Step 5: Update Code Node for Phone Format

The workflow includes phone number formatting, but you can customize it:

**In the "Format SMS Message" code node, the function:**
```javascript
const formatPhoneForVonage = (phone) => {
  return phone.replace(/^\+/, '').replace(/\s/g, '').replace(/^0/, '');
};
```

This converts:
- `+447361971592` → `447361971592`
- `+44 7361 971592` → `447361971592`
- `07361971592` → `447361971592`

---

## Step 6: Test the Workflow

### 6.1 Activate the Workflow

1. **Toggle** the workflow to **Active** (green)
2. **Get** the webhook URL from the Webhook node

### 6.2 Test with PowerShell

```powershell
$webhookUrl = "http://192.168.4.114:5678/webhook/cart-item-added"
$testPayload = @{
    customerName = "Test Customer"
    customerPhone = "+447361971592"  # Will be converted to 447361971592
    items = @(
        @{ name = "Studio Session"; quantity = 1; price = 50.00 }
    )
    total = 50.00
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $webhookUrl -Method POST -ContentType "application/json" -Body $testPayload
```

### 6.3 Check Results

1. **Check your phone** for the SMS
2. **Check n8n Executions** for workflow status
3. **Verify** no errors in the Vonage node

---

## Differences: Twilio vs Vonage

| Feature | Twilio | Vonage |
|---------|--------|--------|
| **Credentials** | Account SID + Auth Token | API Key + API Secret |
| **Phone Format** | `+447361971592` (with +) | `447361971592` (no +) |
| **From Field** | Phone number | Sender ID or number |
| **Node Type** | `n8n-nodes-base.twilio` | `n8n-nodes-base.vonage` |

---

## Troubleshooting

### Error: "Invalid API credentials"

**Solution:**
1. Check API Key and Secret are correct
2. Verify credentials are saved in n8n
3. Test credentials in Vonage dashboard

### Error: "Invalid phone number format"

**Solution:**
1. Ensure phone numbers don't have `+`, spaces, or leading zeros
2. Check the code node is formatting correctly
3. Verify country code is included (e.g., `44` for UK)

### Error: "Invalid sender ID"

**Solution:**
1. Use a registered Vonage number instead
2. Or register your sender ID with Vonage
3. Check Vonage dashboard for approved sender IDs

### SMS Not Received

**Check:**
1. Vonage account has credits/balance
2. Phone number format is correct
3. Sender ID/number is valid
4. Check Vonage dashboard for delivery status

---

## Vonage Sender ID Setup

### Option 1: Use Your Vonage Number

1. Go to Vonage Dashboard → Numbers
2. Find your active number
3. Use it in the "From" field (format: `447700900000`)

### Option 2: Register Sender ID

1. Go to Vonage Dashboard → Settings → Sender IDs
2. Register your brand name (e.g., "PinnacleSSA")
3. Wait for approval (can take 24-48 hours)
4. Use approved sender ID in workflow

---

## Workflow Structure

```
Webhook (POST /cart-item-added)
    ↓
Format SMS Message (Code - formats phone numbers)
    ↓
Send SMS via Vonage
    ↓
Respond to Webhook (Success)
```

---

## Next Steps

1. ✅ Get Vonage API credentials
2. ✅ Set up credentials in n8n
3. ✅ Import/update workflow
4. ✅ Configure sender ID/number
5. ✅ Test workflow
6. ✅ Activate workflow
7. 🔄 Integrate with cart (already done!)

---

## File Reference

- **Workflow File:** `n8n-cart-sms-workflow-vonage.json`
- **Import this file** into n8n to get the Vonage version

---

**Your workflow is ready to use Vonage!** 🎉
