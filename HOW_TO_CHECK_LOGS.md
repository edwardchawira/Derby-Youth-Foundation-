# How to Check Logs for searchInventory Issue

## Step 1: Check Server Console Logs

When you search for "microphones" in the AI chat, check the terminal/console where you ran `npm run dev`.

Look for these log messages:

### Expected Logs (Good):
```
🔍 searchInventory called with query: "microphones"
✅ searchInventory found X products for query: "microphones"
✅ Products found: [ { id: '...', name: '...' }, ... ]
✅ searchInventory result: X products found
```

### Error Logs (Bad):
```
❌ Error searching inventory: ...
❌ Error code: ...
❌ Error message: ...
❌ Error hint: ...
⚠️ No products found for query: "microphones"
```

## Step 2: Test Supabase Connection

Visit this URL in your browser:
```
http://localhost:3000/api/test-supabase
```

This will show:
- If Supabase connection works
- If products table exists
- If there are any products in the database
- If the search query works
- Detailed error messages if something fails

## Step 3: Share the Results

Please share:
1. What you see in the server console logs (copy/paste the relevant lines)
2. What you see when you visit `/api/test-supabase` (or the JSON response)

## Common Issues and What Logs Mean

### "⚠️ No products found for query:"
**Meaning**: The query worked, but the table is empty or no products match
**Fix**: Add products to the database

### "❌ Error code: 42501"
**Meaning**: Permission denied - RLS policy is blocking access
**Fix**: Check RLS policies allow anonymous reads

### "❌ Error: relation 'products' does not exist"
**Meaning**: The products table hasn't been created
**Fix**: Run the migration to create the products table

### "❌ Error code: PGRST..."
**Meaning**: Database connection or query syntax issue
**Fix**: Check Supabase URL and API key

## Quick Fix: Check if Products Table Has Data

Run this in Supabase SQL Editor:
```sql
SELECT COUNT(*) as product_count FROM products;
SELECT id, name, description, price FROM products LIMIT 5;
```

If `product_count` is 0, add some test products:
```sql
INSERT INTO products (name, description, price, technical_specs) VALUES
('Shure SM7B Microphone', 'Professional dynamic microphone for broadcasting and recording', 399.99, '{"type": "Dynamic", "frequency_response": "50Hz-20kHz"}'::jsonb),
('Audio-Technica AT2020', 'Cardioid condenser microphone for studio recording', 99.99, '{"type": "Condenser", "frequency_response": "20Hz-20kHz"}'::jsonb),
('Blue Yeti USB Microphone', 'USB condenser microphone perfect for podcasting', 129.99, '{"type": "Condenser", "interface": "USB"}'::jsonb);
```
