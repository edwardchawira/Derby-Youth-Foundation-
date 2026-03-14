# Fix: Vonage Anti-Spam Rejection (Status Code 6)

## Problem Identified

**Status Code 6:** "Anti-Spam Rejection / Content Blocking"

Your SMS message is being rejected by Vonage's anti-spam filters. This is happening at Stage 2 (Platform acceptance) before it even reaches your phone.

---

## Common Causes of Status Code 6

1. **Emojis in message** (🛒, etc.)
2. **URLs or links** in the message
3. **Spam keywords** (FREE, WIN, PRIZE, etc.)
4. **Unregistered sender ID**
5. **Message format** that triggers spam filters

---

## Solution: Update Message Format

### Option 1: Remove Emojis and Simplify Message

Update the "Format SMS Message" node in n8n to remove emojis and simplify the message:

```javascript
// Extract cart data from webhook payload
const body = $input.item.json.body || $input.item.json;

// Get customer information
const customerName = body.customerName || body.name || 'Customer';
const customerPhone = body.customerPhone || body.phone || '447361971592';
const items = body.items || [];
const total = body.total || 0;

// Format item list (simplified, no emojis)
let itemList = '';
if (items.length > 0) {
  itemList = items.map(item => {
    const itemName = item.name || item.product_name || 'Item';
    const quantity = item.quantity || 1;
    const price = item.price ? `GBP${item.price.toFixed(2)}` : '';
    return `${itemName} x${quantity}${price ? ` (${price})` : ''}`;
  }).join(', ');
} else {
  itemList = 'Items added to cart';
}

// Create simplified SMS message (NO EMOJIS, NO SPECIAL CHARACTERS)
const message = `New Cart Addition

Customer: ${customerName}

Items: ${itemList}

Total: GBP${total.toFixed(2)}

Time: ${new Date().toLocaleString('en-GB', { 
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
    from: '447700900000', // Use your Vonage number, not sender ID
    to: formatPhoneForVonage(customerPhone),
    message: message,
    customerName: customerName,
    itemCount: items.length,
    total: total,
    items: items
  }
};
```

### Option 2: Use Plain Text Only

Even simpler version:

```javascript
const body = $input.item.json.body || $input.item.json;
const customerName = body.customerName || 'Customer';
const items = body.items || [];
const total = body.total || 0;

let itemList = items.map(item => 
  `${item.name} x${item.quantity}`
).join(', ');

const message = `Cart Update: ${itemList}. Total: GBP${total.toFixed(2)}. Customer: ${customerName}`;

const formatPhoneForVonage = (phone) => {
  return phone.replace(/^\+/, '').replace(/\s/g, '').replace(/^0/, '');
};

return {
  json: {
    from: '447700900000', // Your Vonage number
    to: formatPhoneForVonage(body.customerPhone || '447361971592'),
    message: message
  }
};
```

---

## Additional Fixes

### 1. Use Vonage Phone Number Instead of Sender ID

**In the "Format SMS Message" node:**
- Change `from: 'PinnacleSSA'` to `from: 'YOUR_VONAGE_NUMBER'`
- Format: `447700900000` (no +, no spaces)

**Why:** Phone numbers are less likely to trigger spam filters than alphanumeric sender IDs.

### 2. Register Your Sender ID

If you want to use "PinnacleSSA":
1. Go to: https://dashboard.nexmo.com/settings/sender-ids
2. Register "PinnacleSSA" as a sender ID
3. Wait for approval (24-48 hours)
4. Once approved, it's less likely to be flagged as spam

### 3. Avoid Spam Keywords

**Avoid these words in your message:**
- FREE
- WIN
- PRIZE
- CLICK
- URGENT
- LIMITED TIME
- ACT NOW

**Use neutral language:**
- "Cart Update" instead of "New Cart Addition!"
- "Items added" instead of "🛒 New Cart Addition!"

---

## Steps to Fix in n8n

1. **Open n8n:** http://192.168.4.114:5678
2. **Open workflow:** "Cart Item Added - SMS Notification (Vonage)"
3. **Click "Format SMS Message" node**
4. **Replace the JavaScript code** with one of the options above (Option 1 or 2)
5. **Update the "from" field** to use your Vonage phone number
6. **Save the workflow**
7. **Test again**

---

## Test After Fix

After updating the message format:
1. Send a test webhook
2. Check Vonage dashboard
3. Look for Status Code 6 - it should be gone
4. Message should show "Delivered" status

---

## If Still Getting Status Code 6

1. **Contact Vonage Support:**
   - Email: support@vonage.com
   - Explain you're getting Status Code 6
   - Ask them to whitelist your sender ID or number
   - Provide your Vonage account details

2. **Simplify Message Further:**
   - Remove all special characters
   - Use only letters, numbers, and basic punctuation
   - Keep message under 160 characters

3. **Use Different Sender:**
   - Try a different Vonage phone number
   - Or register a different sender ID

---

**The main issue is the emoji (🛒) and possibly the message format triggering spam filters. Remove the emoji and simplify the message, and it should work!**
