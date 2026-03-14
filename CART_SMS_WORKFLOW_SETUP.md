# Cart SMS Notification Workflow Setup

## Overview

This guide shows you how to set up an n8n workflow that sends SMS notifications when products are added to the cart.

---

## Step 1: Create the Workflow in n8n

### Option A: Import the Workflow (Recommended)

1. **Open n8n** at `http://192.168.4.114:5678/`
2. Click **"Workflows"** in the sidebar
3. Click **"Import from File"** or the **"+"** button → **"Import from File"**
4. Select the file: `n8n-cart-sms-workflow.json`
5. The workflow will be imported with all nodes configured

### Option B: Create Manually

1. **Create New Workflow:**
   - Click **"Workflows"** → **"Add Workflow"**
   - Name it: `Cart Item Added - SMS Notification`

2. **Add Webhook Trigger:**
   - Click **"+"** to add a node
   - Search for **"Webhook"**
   - Configure:
     - **HTTP Method:** `POST`
     - **Path:** `cart-item-added`
     - **Response Mode:** `Respond to Webhook`
   - Click **"Execute Node"** to get the webhook URL
   - **Copy the webhook URL** (you'll need this later)

3. **Add Code Node (Format Message):**
   - Add a **"Code"** node after the webhook
   - Name it: `Format SMS Message`
   - Language: **JavaScript**
   - Paste this code:

```javascript
// Extract cart data from webhook payload
const body = $input.item.json.body || $input.item.json;

const customerName = body.customerName || body.name || 'Customer';
const customerPhone = body.customerPhone || body.phone || '';
const items = body.items || [];
const total = body.total || 0;

// Format item list
let itemList = '';
if (items.length > 0) {
  itemList = items.map(item => 
    `- ${item.name || item.product_name} (Qty: ${item.quantity || 1})`
  ).join('\n');
} else {
  itemList = 'Items added to cart';
}

// Create SMS message
const message = `🛒 New Cart Addition!

Customer: ${customerName}

Items:
${itemList}

Total: £${total.toFixed(2)}

Time: ${new Date().toLocaleString('en-GB')}`;

return {
  json: {
    to: customerPhone || '+447361971592', // Default phone or from payload
    message: message,
    customerName: customerName,
    itemCount: items.length,
    total: total
  }
};
```

4. **Add Twilio Node:**
   - Add a **"Twilio"** node after the Code node
   - Name it: `Send SMS via Twilio`
   - Configure:
     - **From:** `+14155238886` (your Twilio number)
     - **To:** `={{ $json.to }}` (from previous node)
     - **Message:** `={{ $json.message }}`
     - **To WhatsApp:** `false` (for SMS)
   - **Connect your Twilio credentials** (you already have them configured)

5. **Add Respond Node:**
   - Add **"Respond to Webhook"** node at the end
   - Configure:
     - **Respond With:** `JSON`
     - **Response Body:** `={{ { "success": true, "message": "SMS sent successfully" } }}`
     - **Response Code:** `200`

6. **Connect the Nodes:**
   - Webhook → Format SMS Message → Send SMS via Twilio → Respond to Webhook

7. **Activate the Workflow:**
   - Click the **"Active"** toggle at the top
   - The workflow is now live!

---

## Step 2: Integrate with Your Cart

You need to call the n8n webhook when items are added to the cart. Here are two approaches:

### Approach A: Call Webhook from Frontend (Simpler)

Modify `lib/cart-context.tsx` to call the webhook:

```typescript
// Add this function to your cart context
const notifyCartAddition = async (item: CartItem, customerPhone?: string) => {
  try {
    const webhookUrl = 'http://192.168.4.114:5678/webhook/cart-item-added';
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerName: 'Customer', // You can get this from auth if available
        customerPhone: customerPhone || '+447361971592', // Default or from user profile
        items: [item],
        total: item.price * item.quantity * (item.duration || 1),
      }),
    });
  } catch (error) {
    console.error('Failed to notify cart addition:', error);
    // Don't block cart functionality if webhook fails
  }
};

// Modify the addItem function:
const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
  setItems(prev => {
    const existing = prev.find(item => item.id === newItem.id && item.duration === newItem.duration);
    let updatedItems;
    
    if (existing) {
      updatedItems = prev.map(item =>
        item.id === newItem.id && item.duration === newItem.duration
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedItems = [...prev, { ...newItem, quantity: 1 }];
    }
    
    // Notify n8n when item is added
    const addedItem = updatedItems.find(item => item.id === newItem.id);
    if (addedItem) {
      notifyCartAddition(addedItem);
    }
    
    return updatedItems;
  });
};
```

### Approach B: Use Supabase Database Trigger (More Robust)

Create a Supabase function that calls the webhook when `cart_items` table is updated:

1. **Create a Supabase Edge Function:**

Create `supabase/functions/cart-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL") || 
  "http://192.168.4.114:5678/webhook/cart-item-added";

serve(async (req) => {
  try {
    const payload = await req.json();
    
    // Call n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName: payload.customerName || "Customer",
        customerPhone: payload.customerPhone || "+447361971592",
        items: payload.items || [],
        total: payload.total || 0,
      }),
    });

    return new Response(
      JSON.stringify({ success: true, n8nResponse: await response.json() }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

2. **Create Database Trigger:**

Create a migration file `supabase/migrations/[timestamp]_cart_webhook_trigger.sql`:

```sql
-- Function to call webhook when cart item is added
CREATE OR REPLACE FUNCTION notify_cart_addition()
RETURNS TRIGGER AS $$
DECLARE
  product_name text;
  customer_phone text;
BEGIN
  -- Get product name
  SELECT name INTO product_name
  FROM products
  WHERE id = NEW.product_id;
  
  -- Get customer phone (if available in user metadata)
  -- You may need to adjust this based on your user table structure
  SELECT raw_user_meta_data->>'phone' INTO customer_phone
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Call Supabase Edge Function (which calls n8n)
  PERFORM net.http_post(
    url := current_setting('app.settings.n8n_webhook_url', true) || '/functions/v1/cart-webhook',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'customerName', COALESCE((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = NEW.user_id), 'Customer'),
      'customerPhone', COALESCE(customer_phone, '+447361971592'),
      'items', jsonb_build_array(
        jsonb_build_object(
          'name', product_name,
          'quantity', NEW.quantity
        )
      ),
      'total', (SELECT price FROM products WHERE id = NEW.product_id) * NEW.quantity
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_cart_item_added ON cart_items;
CREATE TRIGGER on_cart_item_added
  AFTER INSERT ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_cart_addition();
```

**Note:** This approach requires `pg_net` extension in Supabase. You may need to enable it first.

---

## Step 3: Test the Workflow

### Test via n8n UI:

1. In n8n, click **"Execute Workflow"**
2. In the Webhook node, you'll see sample data
3. Click **"Test Workflow"** to see if it processes correctly

### Test via API:

```bash
curl -X POST http://192.168.4.114:5678/webhook/cart-item-added \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "customerPhone": "+447361971592",
    "items": [
      {
        "name": "Test Product",
        "quantity": 2
      }
    ],
    "total": 50.00
  }'
```

### Test from Your App:

1. Add an item to your cart
2. Check if SMS is received
3. Check n8n execution logs for any errors

---

## Step 4: Customize the SMS Message

Edit the **"Format SMS Message"** Code node to customize:

- Message format
- Include/exclude fields
- Add emojis or formatting
- Add links or additional information

---

## Troubleshooting

### SMS Not Sending:

1. **Check Twilio Credentials:**
   - Verify Twilio account is connected in n8n
   - Check Twilio phone number is correct

2. **Check Webhook URL:**
   - Verify the webhook URL is correct
   - Make sure workflow is **Active**

3. **Check Execution Logs:**
   - In n8n, go to **"Executions"**
   - Check for error messages
   - Review each node's output

### Webhook Not Receiving Data:

1. **Check Network:**
   - Ensure n8n is accessible from your app
   - Check firewall settings

2. **Check Payload Format:**
   - Verify JSON structure matches what workflow expects
   - Check Content-Type header is `application/json`

---

## Next Steps

1. ✅ Create workflow in n8n
2. ✅ Integrate webhook call in your cart
3. ✅ Test the workflow
4. ✅ Customize SMS message format
5. ✅ Monitor executions in n8n

---

## Workflow Webhook URL

After creating the workflow, your webhook URL will be:
```
http://192.168.4.114:5678/webhook/cart-item-added
```

**Or if using n8n cloud:**
```
https://your-n8n-instance.app.n8n.cloud/webhook/cart-item-added
```

Save this URL - you'll need it for integration!
