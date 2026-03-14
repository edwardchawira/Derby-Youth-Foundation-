# Where to Paste Your n8n Webhook URL

## Quick Answer

**Paste your webhook URL in:** `lib/cart-context.tsx` on **line 45**

Look for this line:
```typescript
const N8N_WEBHOOK_URL = 'http://192.168.4.114:5678/webhook/cart-item-added'; // ⬅️ PASTE YOUR WEBHOOK URL HERE
```

Replace the URL with your actual webhook URL from n8n!

---

## Step-by-Step Instructions

### Step 1: Get Your Webhook URL from n8n

1. Open your n8n workflow: `http://192.168.4.114:5678/`
2. Click on the **"Webhook"** node
3. Click **"Listen for Test Event"** or check the node details
4. Copy the webhook URL - it will look like:
   ```
   http://192.168.4.114:5678/webhook/cart-item-added
   ```
   or
   ```
   http://192.168.4.114:5678/webhook-test/cart-item-added
   ```

### Step 2: Open the Cart Context File

1. Open: `lib/cart-context.tsx`
2. Find line 45 (or search for `N8N_WEBHOOK_URL`)

### Step 3: Paste Your Webhook URL

Replace this line:
```typescript
const N8N_WEBHOOK_URL = 'http://192.168.4.114:5678/webhook/cart-item-added';
```

With your actual webhook URL:
```typescript
const N8N_WEBHOOK_URL = 'YOUR_WEBHOOK_URL_HERE';
```

**Example:**
```typescript
const N8N_WEBHOOK_URL = 'http://192.168.4.114:5678/webhook/cart-item-added';
```

---

## What Happens Next?

Once you paste the URL:

1. ✅ Every time someone adds an item to the cart, the webhook will be called
2. ✅ n8n will receive the cart data
3. ✅ SMS will be sent to the customer's phone number
4. ✅ The cart will continue to work normally (webhook failures won't break it)

---

## Testing

After pasting the URL:

1. **Save the file** (`lib/cart-context.tsx`)
2. **Restart your Next.js dev server** if it's running
3. **Add an item to your cart** on your website
4. **Check your phone** - you should receive an SMS!
5. **Check n8n executions** - you should see the workflow ran

---

## Customizing Customer Information

If you want to get the actual customer name and phone number:

### Option 1: Get from Auth (if user is logged in)

Modify the `notifyCartAddition` function:

```typescript
import { supabase } from '@/lib/supabase';

const notifyCartAddition = async (items: CartItem[]) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    const customerName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Customer';
    const customerPhone = user?.user_metadata?.phone || '+447361971592';

    // ... rest of the code
  } catch (error) {
    console.error('Failed to notify cart addition:', error);
  }
};
```

### Option 2: Get from Cart Page Form

If you collect customer info on the cart page, you can pass it through the context or store it in state.

---

## Troubleshooting

### Webhook Not Being Called

1. **Check the URL is correct:**
   - Make sure it matches exactly what n8n shows
   - Check for typos
   - Ensure it includes `http://` or `https://`

2. **Check n8n workflow is Active:**
   - Toggle must be ON (green) in n8n

3. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for errors when adding items to cart

### SMS Not Sending

1. **Check n8n Executions:**
   - Go to n8n → Executions
   - Check if workflow ran
   - Look for error messages

2. **Check Twilio Credentials:**
   - Verify Twilio node has correct credentials
   - Check phone number format (must be E.164: +447361971592)

3. **Check Webhook Payload:**
   - In n8n execution, check what data was received
   - Verify customer phone number is included

---

## File Location

The file you need to edit is:
```
lib/cart-context.tsx
```

Line to edit: **Line 45** (or search for `N8N_WEBHOOK_URL`)

---

## Quick Reference

**What to do:**
1. Copy webhook URL from n8n
2. Open `lib/cart-context.tsx`
3. Find line with `N8N_WEBHOOK_URL`
4. Paste your URL
5. Save file
6. Test by adding item to cart

**That's it!** 🎉
