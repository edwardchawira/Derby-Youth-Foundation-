# Import Cart SMS Workflow to n8n

## Quick Import Steps

### Step 1: Open n8n
1. Go to: `http://192.168.4.114:5678/`
2. Log in if needed

### Step 2: Import the Workflow
1. Click **"Workflows"** in the left sidebar
2. Click the **"+"** button (top right) or **"Add Workflow"**
3. Click **"Import from File"** or the **"..."** menu → **"Import from File"**
4. Select the file: `n8n-cart-sms-workflow-complete.json`
5. The workflow will be imported with all nodes configured

### Step 3: Verify Configuration

1. **Check Webhook Node:**
   - Click on the **"Webhook"** node
   - Verify:
     - HTTP Method: `POST`
     - Path: `cart-item-added`
     - Response Mode: `Respond to Webhook`
   - Click **"Listen for Test Event"** to get the webhook URL
   - **Copy the webhook URL** - you'll need this!

2. **Check Twilio Node:**
   - Click on **"Send SMS via Twilio"** node
   - Verify:
     - From: `+14155238886` (your Twilio number)
     - To: `={{ $json.to }}` (dynamic from webhook)
     - Message: `={{ $json.message }}` (formatted message)
   - If credentials show as missing, click **"Create New Credential"** and connect your Twilio account

3. **Check Code Node:**
   - Click on **"Format SMS Message"** node
   - The code should format:
     - Customer name
     - List of items with quantities
     - Total price
     - Timestamp

### Step 4: Test the Workflow

1. **Get Webhook URL:**
   - In the Webhook node, click **"Listen for Test Event"**
   - Copy the webhook URL (e.g., `http://192.168.4.114:5678/webhook/cart-item-added`)

2. **Test with curl:**
   ```bash
   curl -X POST http://192.168.4.114:5678/webhook/cart-item-added \
     -H "Content-Type: application/json" \
     -d '{
       "customerName": "John Doe",
       "customerPhone": "+447361971592",
       "items": [
         {
           "name": "Studio Session",
           "quantity": 2,
           "price": 50.00
         },
         {
           "name": "Microphone Rental",
           "quantity": 1,
           "price": 25.00
         }
       ],
       "total": 125.00
     }'
   ```

3. **Check Execution:**
   - Go to **"Executions"** in n8n sidebar
   - You should see the workflow execution
   - Check each node to see the data flow
   - Verify SMS was sent (check your phone!)

### Step 5: Activate the Workflow

1. Click the **"Active"** toggle at the top of the workflow
2. The workflow is now live and will process webhook requests!

---

## Workflow Structure

```
Webhook (POST /cart-item-added)
    ↓
Format SMS Message (Code Node)
    ↓
Send SMS via Twilio
    ↓
Respond to Webhook (Success Response)
```

---

## Expected Webhook Payload

The workflow expects this JSON structure:

```json
{
  "customerName": "John Doe",
  "customerPhone": "+447361971592",
  "items": [
    {
      "name": "Product Name",
      "quantity": 2,
      "price": 50.00
    }
  ],
  "total": 100.00
}
```

---

## SMS Message Format

The SMS will look like this:

```
🛒 New Cart Addition!

Customer: John Doe

Items:
• Studio Session x2 (£50.00)
• Microphone Rental x1 (£25.00)

Total: £125.00

Time: 18/01/2026, 14:30
```

---

## Troubleshooting

### SMS Not Sending

1. **Check Twilio Credentials:**
   - Go to n8n Settings → Credentials
   - Verify Twilio credentials are connected
   - Test credentials if needed

2. **Check Phone Number Format:**
   - Ensure phone numbers are in E.164 format: `+447361971592`
   - Include country code with `+`

3. **Check Execution Logs:**
   - Go to Executions
   - Click on failed execution
   - Check error messages in each node

### Webhook Not Receiving Requests

1. **Check Workflow is Active:**
   - Toggle must be ON (green)

2. **Check Webhook URL:**
   - Copy the exact URL from the Webhook node
   - Ensure it's accessible from your application

3. **Check Network:**
   - If calling from external app, ensure n8n is accessible
   - Check firewall settings

---

## Next Steps

1. ✅ Import workflow
2. ✅ Test workflow
3. ✅ Activate workflow
4. 🔄 Integrate webhook call in your cart code
5. 🔄 Test end-to-end from your application

---

## Integration Code

To call this webhook from your cart, add this to your cart context:

```typescript
const notifyCartAddition = async (items: CartItem[], customerPhone?: string) => {
  try {
    const webhookUrl = 'http://192.168.4.114:5678/webhook/cart-item-added';
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Customer', // Get from auth if available
        customerPhone: customerPhone || '+447361971592',
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: items.reduce((sum, item) => 
          sum + (item.price * item.quantity * (item.duration || 1)), 0
        )
      })
    });
  } catch (error) {
    console.error('Failed to notify cart addition:', error);
  }
};
```

---

Your workflow is ready! Import it and test it out! 🚀
