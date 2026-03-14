# How to Import n8n Workflow - Step by Step

## Method 1: Import via n8n UI (Easiest)

### Step 1: Open n8n
1. Go to your n8n instance: `http://192.168.4.114:5678/`
2. Log in if needed

### Step 2: Navigate to Workflows
1. Click **"Workflows"** in the left sidebar
2. You'll see your list of workflows

### Step 3: Import the File
1. Click the **"+"** button (top right corner) or **"Add Workflow"** button
2. You'll see options:
   - **"Blank Workflow"** - Creates empty workflow
   - **"Import from File"** - This is what you want!
   - **"Import from URL"** - Import from a URL
   - **"Import from Clipboard"** - Paste workflow JSON

3. Click **"Import from File"**
4. A file picker will open
5. Navigate to your project folder: `C:\Users\masha\Pinnaclessa\PinnacleSSA\`
6. Select the file: **`n8n-cart-sms-workflow-complete.json`**
7. Click **"Open"** or **"Select"**

### Step 4: Workflow Imported!
- The workflow will appear in your workflows list
- All nodes should be configured
- The workflow name will be: **"Cart Item Added - SMS Notification"**

---

## Method 2: Import via Clipboard (Alternative)

### Step 1: Copy Workflow JSON
1. Open the file: `n8n-cart-sms-workflow-complete.json`
2. Select all content (Ctrl+A)
3. Copy it (Ctrl+C)

### Step 2: Import in n8n
1. Go to n8n: `http://192.168.4.114:5678/`
2. Click **"Workflows"** → **"+"** → **"Import from Clipboard"**
3. Paste the JSON (Ctrl+V)
4. Click **"Import"**

---

## Method 3: Drag and Drop (If Supported)

Some n8n versions support drag and drop:

1. Open n8n workflows page
2. Drag the `n8n-cart-sms-workflow-complete.json` file
3. Drop it onto the workflows page
4. The workflow will import automatically

---

## After Import - What to Check

### 1. Verify Workflow Structure
- You should see 4 nodes:
  - **Webhook** (trigger)
  - **Format SMS Message** (code node)
  - **Send SMS via Twilio** (Twilio node)
  - **Respond to Webhook** (response node)

### 2. Check Webhook Node
1. Click on the **"Webhook"** node
2. Verify:
   - HTTP Method: `POST`
   - Path: `cart-item-added`
   - Response Mode: `Respond to Webhook`
3. Click **"Listen for Test Event"** to get the webhook URL
4. **Copy the webhook URL** - it will look like:
   ```
   http://192.168.4.114:5678/webhook/cart-item-added
   ```

### 3. Check Twilio Credentials
1. Click on **"Send SMS via Twilio"** node
2. Check if Twilio credentials are connected:
   - If you see **"Twilio account"** - ✅ Good!
   - If you see **"Create New Credential"** - Click it and connect your Twilio account
3. Verify:
   - From: `+14155238886`
   - To: `={{ $json.to }}`
   - Message: `={{ $json.message }}`

### 4. Activate the Workflow
1. Click the **"Active"** toggle at the top of the workflow
2. It should turn green/ON
3. The workflow is now live and ready to receive webhooks!

---

## Quick Test After Import

### Test 1: Manual Test in n8n
1. Click **"Execute Workflow"** button (top right)
2. The workflow will run with sample data
3. Check each node to see the data flow
4. Verify the SMS message format looks correct

### Test 2: Test with curl (Command Line)
```bash
curl -X POST http://192.168.4.114:5678/webhook/cart-item-added \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "customerPhone": "+447361971592",
    "items": [
      {
        "name": "Studio Session",
        "quantity": 2,
        "price": 50.00
      }
    ],
    "total": 100.00
  }'
```

### Test 3: Test from PowerShell
```powershell
$body = @{
    customerName = "Test Customer"
    customerPhone = "+447361971592"
    items = @(
        @{
            name = "Studio Session"
            quantity = 2
            price = 50.00
        }
    )
    total = 100.00
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://192.168.4.114:5678/webhook/cart-item-added" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## Troubleshooting

### Problem: "Import Failed" or "Invalid JSON"
**Solution:**
- Make sure you selected the correct file: `n8n-cart-sms-workflow-complete.json`
- Check if the file is not corrupted
- Try Method 2 (Clipboard import) instead

### Problem: "Twilio Credentials Missing"
**Solution:**
1. Click on "Send SMS via Twilio" node
2. Click "Create New Credential"
3. Select "Twilio API"
4. Enter:
   - Account SID
   - Auth Token
   - (These are from your Twilio dashboard)

### Problem: "Webhook URL Not Working"
**Solution:**
1. Make sure workflow is **Active** (toggle ON)
2. Check the webhook path is correct: `cart-item-added`
3. Verify n8n is accessible at `http://192.168.4.114:5678/`
4. Check firewall settings if calling from external app

### Problem: "Workflow Not Showing"
**Solution:**
1. Refresh the workflows page
2. Check if it's in a different folder/project
3. Use the search bar to find "Cart Item Added"

---

## Next Steps After Import

1. ✅ Import workflow
2. ✅ Verify all nodes are configured
3. ✅ Test the workflow
4. ✅ Activate the workflow
5. 🔄 Get the webhook URL
6. 🔄 Integrate with your cart code
7. 🔄 Test end-to-end

---

## File Location Reference

Your workflow file is located at:
```
C:\Users\masha\Pinnaclessa\PinnacleSSA\n8n-cart-sms-workflow-complete.json
```

You can also use:
- `n8n-cart-sms-workflow.json` (original version)

Both files contain the same workflow, use either one!

---

**Need help?** Check the execution logs in n8n (Executions → View Details) to see what's happening at each step!
