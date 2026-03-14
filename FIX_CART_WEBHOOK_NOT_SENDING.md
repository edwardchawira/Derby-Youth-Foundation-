# Fix: Cart Webhook Not Sending SMS

## Problem
Test messages work, but when adding items to cart in the application, SMS is not being sent.

## Root Cause
The webhook is likely being blocked by **CORS (Cross-Origin Resource Sharing)** because:
- Your app runs on: `http://localhost:3000` (or your domain)
- n8n webhook is on: `http://192.168.4.114:5678`
- Browsers block cross-origin requests unless CORS is configured

## Solutions

### Solution 1: Configure n8n CORS (Recommended)

1. **Edit n8n configuration:**
   - Find n8n config file (usually `~/.n8n/config` or environment variables)
   - Add CORS settings:

```bash
# In n8n environment variables or config
N8N_CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
```

Or if using Docker:
```yaml
environment:
  - N8N_CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
```

2. **Restart n8n** after making changes

### Solution 2: Use Next.js API Route (Better for Production)

Create an API route that proxies the request to n8n:

1. **Create:** `app/api/cart-notification/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const n8nWebhookUrl = 'http://192.168.4.114:5678/webhook/cart-item-added';
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Cart notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
```

2. **Update cart-context.tsx:**

Change the webhook URL to:
```typescript
const N8N_WEBHOOK_URL = '/api/cart-notification'; // Use API route instead
```

### Solution 3: Check Browser Console

1. **Open browser console** (F12)
2. **Add an item to cart**
3. **Look for errors:**
   - CORS errors: "Access to fetch blocked by CORS policy"
   - Network errors: "Failed to fetch"
   - Other errors

4. **Check if webhook is being called:**
   - Look for console.log messages: "Sending cart notification to n8n"
   - Check Network tab for the request to n8n

### Solution 4: Verify n8n Webhook is Accessible

Test if the webhook is accessible from your browser:

1. **Open browser console** (F12)
2. **Run this command:**
```javascript
fetch('http://192.168.4.114:5678/webhook/cart-item-added', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerName: 'Test',
    customerPhone: '+447361971592',
    items: [{ name: 'Test', quantity: 1, price: 10 }],
    total: 10
  })
}).then(r => r.json()).then(console.log).catch(console.error);
```

3. **If you see a CORS error**, that's the problem

## Debugging Steps

### Step 1: Check Browser Console
1. Open your app in browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Add an item to cart
5. Look for:
   - "Sending cart notification to n8n" (should appear)
   - Any error messages
   - CORS errors

### Step 2: Check Network Tab
1. In DevTools, go to Network tab
2. Add an item to cart
3. Look for request to `cart-item-added`
4. Check:
   - Status code (200 = success, CORS error = blocked)
   - Response
   - Request payload

### Step 3: Test Webhook Directly
Use the test command above to see if webhook is accessible

## Quick Fix: Use API Route

The easiest solution is to create a Next.js API route that proxies to n8n. This:
- ✅ Avoids CORS issues
- ✅ Keeps n8n URL server-side (more secure)
- ✅ Works in production
- ✅ Allows error handling

## Current Status

I've added better logging to `cart-context.tsx`. When you add items to cart:
- Check browser console (F12)
- Look for "Sending cart notification to n8n" message
- Check for any error messages

This will help identify if it's a CORS issue or something else.
