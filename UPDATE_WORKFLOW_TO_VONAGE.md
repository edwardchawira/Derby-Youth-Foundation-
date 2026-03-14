# Update Existing Workflow to Use Vonage

## Quick Steps to Replace Twilio with Vonage

### Step 1: Open Your Workflow in n8n

1. Go to: `http://192.168.4.114:5678/`
2. Open your workflow: **"Cart Item Added - SMS Notification"**

### Step 2: Remove Twilio Node

1. **Click** on the **"Send SMS via Twilio"** node
2. **Press Delete** key, or right-click → **Delete**
3. The node will be removed

### Step 3: Add Vonage Node

1. **Click** on the **"Format SMS Message"** node
2. **Hover** over the connection point (right side)
3. **Click and drag** to create a new connection
4. **Search** for "Vonage" in the node search
5. **Select:** "Vonage" node
6. The node will be added and connected

### Step 4: Configure Vonage Node

1. **Click** on the new **"Vonage"** node
2. **Configure:**
   - **Operation:** `Send SMS`
   - **From:** `PinnacleSSA` (or your Vonage number like `447700900000`)
   - **To:** `={{ $json.to }}`
   - **Text:** `={{ $json.message }}`
3. **Credentials:**
   - Click **"Credential to connect with"**
   - Select your **"Vonage account"** credentials (the ones you just added)
4. **Name the node:** "Send SMS via Vonage"

### Step 5: Connect to Respond Node

1. **Click** on the **"Send SMS via Vonage"** node
2. **Drag** from its output to the **"Respond to Webhook"** node
3. They should now be connected

### Step 6: Update Code Node (Phone Format)

The code node needs to format phone numbers for Vonage (no +, spaces, or leading zeros):

1. **Click** on **"Format SMS Message"** node
2. **Replace** the code with this:

```javascript
// Extract cart data from webhook payload
const body = $input.item.json.body || $input.item.json;

// Get customer information
const customerName = body.customerName || body.name || 'Customer';
const customerPhone = body.customerPhone || body.phone || '447361971592';
const items = body.items || [];
const total = body.total || 0;

// Format item list
let itemList = '';
if (items.length > 0) {
  itemList = items.map(item => {
    const itemName = item.name || item.product_name || 'Item';
    const quantity = item.quantity || 1;
    const price = item.price ? `£${item.price.toFixed(2)}` : '';
    return `• ${itemName} x${quantity}${price ? ` (${price})` : ''}`;
  }).join('\n');
} else {
  itemList = 'Items added to cart';
}

// Create formatted SMS message
const message = `🛒 New Cart Addition!\n\nCustomer: ${customerName}\n\nItems:\n${itemList}\n\nTotal: £${total.toFixed(2)}\n\nTime: ${new Date().toLocaleString('en-GB', { 
  day: '2-digit', 
  month: '2-digit', 
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}`;

// Vonage requires phone numbers without +, spaces, or leading zeros
const formatPhoneForVonage = (phone) => {
  return phone.replace(/^\+/, '').replace(/\s/g, '').replace(/^0/, '');
};

return {
  json: {
    from: 'PinnacleSSA', // Your Vonage sender ID or number
    to: formatPhoneForVonage(customerPhone),
    message: message,
    customerName: customerName,
    itemCount: items.length,
    total: total,
    items: items
  }
};
```

3. **Save** the node

### Step 7: Save and Activate

1. **Click** "Save" (top right)
2. **Toggle** workflow to **Active** (green)
3. **Test** the workflow!

---

## Alternative: Import New Workflow

If you prefer to start fresh:

1. **Delete** the old workflow (or keep it as backup)
2. **Import:** `n8n-cart-sms-workflow-vonage.json`
3. **Connect** your Vonage credentials
4. **Activate** and test

---

## Final Workflow Structure

```
Webhook (POST /cart-item-added)
    ↓
Format SMS Message (Code - formats phone for Vonage)
    ↓
Send SMS via Vonage ← NEW!
    ↓
Respond to Webhook (Success)
```

---

## Test After Update

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

---

**That's it! Your workflow now uses Vonage instead of Twilio!** ✅
