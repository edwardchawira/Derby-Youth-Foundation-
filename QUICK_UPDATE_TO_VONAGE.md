# Quick Update: Replace Twilio with Vonage

## Fast Manual Steps (2 minutes)

### Step 1: Open Your Workflow
1. Go to: `http://192.168.4.114:5678/`
2. Open workflow: **"Cart Item Added - SMS Notification"**

### Step 2: Delete Twilio Node
1. **Click** on the **"Send SMS via Twilio"** node
2. **Press Delete** key (or right-click → Delete)
3. ✅ Twilio node removed

### Step 3: Add Vonage Node
1. **Click** on the **"Format SMS Message"** node
2. **Hover** over the connection point on the right side
3. **Click and drag** to create a new connection
4. **Type "Vonage"** in the search box
5. **Select:** "Vonage" node
6. ✅ Vonage node added

### Step 4: Configure Vonage Node
1. **Click** on the new **"Vonage"** node
2. **Set these fields:**
   - **Operation:** `Send SMS`
   - **From:** `PinnacleSSA` (or your Vonage number)
   - **To:** `={{ $json.to }}`
   - **Text:** `={{ $json.message }}`
3. **Credentials:**
   - Click **"Credential to connect with"**
   - Select **"Vonage account"** (the credentials you added)
4. **Name the node:** "Send SMS via Vonage" (optional, but helpful)

### Step 5: Connect to Respond Node
1. **Click** on **"Send SMS via Vonage"** node
2. **Drag** from its output (right side) to **"Respond to Webhook"** node
3. ✅ Connection complete

### Step 6: Update Code Node (Phone Formatting)
1. **Click** on **"Format SMS Message"** node
2. **Replace** the entire code with this:

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
// Convert +447361971592 to 447361971592
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

3. **Click "Execute Node"** to test (optional)
4. **Save** the workflow

### Step 7: Activate Workflow
1. **Toggle** the workflow to **Active** (green switch in top right)
2. ✅ Done!

---

## Final Workflow Structure

```
Webhook (POST /cart-item-added)
    ↓
Format SMS Message (Code - formats phone for Vonage)
    ↓
Send SMS via Vonage
    ↓
Respond to Webhook (Success)
```

---

## Verify It Works

1. **Check** the workflow is active (green)
2. **Test** by adding an item to your cart
3. **Check** your phone for the SMS
4. **Check** n8n Executions for any errors

---

**That's it! Your workflow now uses Vonage instead of Twilio.** 🎉
