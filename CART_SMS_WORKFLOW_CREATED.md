# Cart SMS Workflow Created Successfully ✅

## Workflow Details

- **Workflow ID**: `GjoXLfx2N6lQO3WX`
- **Workflow Name**: `Cart Item Added - SMS Notification (Vonage)`
- **Status**: Created (needs activation)
- **n8n URL**: http://192.168.4.114:5678

## Next Steps

### 1. Activate the Workflow

1. Open n8n at: http://192.168.4.114:5678
2. Navigate to **Workflows**
3. Find the workflow: **"Cart Item Added - SMS Notification (Vonage)"**
4. Click the **toggle switch** in the top-right to activate it
5. The workflow will now listen for webhook requests

### 2. Configure Vonage Credentials

1. In the workflow, click on the **"Send SMS via Vonage"** node
2. Click **"Create New Credential"** or select existing Vonage credentials
3. Enter your Vonage API credentials:
   - **API Key**: Your Vonage API key
   - **API Secret**: Your Vonage API secret
4. Save the credentials

### 3. Get the Webhook URL

1. Click on the **"Webhook"** node in the workflow
2. Click **"Execute Node"** to test it
3. Copy the **Webhook URL** (should be: `http://192.168.4.114:5678/webhook/cart-item-added`)
4. Verify this matches the URL in `lib/cart-context.tsx`:
   ```typescript
   const N8N_WEBHOOK_URL = 'http://192.168.4.114:5678/webhook/cart-item-added';
   ```

### 4. Test the Workflow

1. Add an item to your cart in the application
2. Check n8n **Executions** tab to see if the workflow ran
3. Verify the SMS was sent (check your Vonage dashboard)

## Workflow Structure

The workflow consists of 4 nodes:

1. **Webhook** - Receives POST requests when items are added to cart
2. **Format SMS Message** - Formats the cart data into an SMS message
3. **Send SMS via Vonage** - Sends the SMS using Vonage API
4. **Respond to Webhook** - Returns a success response

## Webhook Payload Format

The workflow expects this JSON structure:

```json
{
  "customerName": "Customer",
  "customerPhone": "+447361971592",
  "items": [
    {
      "name": "Item Name",
      "quantity": 1,
      "price": 50.00
    }
  ],
  "total": 50.00
}
```

## Troubleshooting

### Workflow not triggering
- Check if the workflow is **activated** (toggle switch is ON)
- Verify the webhook URL matches in `lib/cart-context.tsx`
- Check n8n **Executions** tab for errors

### SMS not sending
- Verify Vonage credentials are configured correctly
- Check Vonage account has sufficient credits
- Verify phone number format (Vonage requires numbers without + or spaces)

### Webhook errors
- Check n8n logs in the **Executions** tab
- Verify the payload structure matches expected format
- Check network connectivity between your app and n8n

---

**Workflow is ready!** Just activate it and configure Vonage credentials. 🚀
