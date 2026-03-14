# Fix: Empty Inventory Issue

## Problem
The search is working correctly now (tool name mismatch is fixed), but the products table is empty or doesn't have any products matching "microphone".

## Solution

### Step 1: Check if Products Table Has Data

Run this in **Supabase SQL Editor**:
```sql
SELECT COUNT(*) as product_count FROM products;
SELECT id, name, description, price FROM products LIMIT 5;
```

### Step 2: Add Test Products

If the count is 0, add test products using the SQL file `ADD_TEST_PRODUCTS.sql`:

1. Go to Supabase Dashboard
2. Click on "SQL Editor"
3. Copy and paste the contents of `ADD_TEST_PRODUCTS.sql`
4. Click "Run"

Or run this directly:
```sql
INSERT INTO products (name, description, price, technical_specs) VALUES
('Shure SM7B Dynamic Microphone', 'Professional broadcast dynamic microphone', 399.99, '{"type": "Dynamic", "frequency_response": "50Hz-20kHz"}'::jsonb),
('Audio-Technica AT2020', 'Cardioid condenser microphone for studio recording', 99.99, '{"type": "Condenser", "frequency_response": "20Hz-20kHz"}'::jsonb),
('Blue Yeti USB Microphone', 'USB condenser microphone perfect for podcasting', 129.99, '{"type": "Condenser", "interface": "USB"}'::jsonb),
('Rode NT1-A Condenser Microphone', 'Large-diaphragm condenser microphone', 229.00, '{"type": "Condenser"}'::jsonb);
```

### Step 3: Verify Products Were Added

```sql
SELECT name, description, price FROM products 
WHERE name ILIKE '%microphone%' OR description ILIKE '%microphone%';
```

You should see at least 3-4 products with "microphone" in the name or description.

### Step 4: Test the Search Again

Now try searching for "microphones" in the AI assistant again. It should find products!

## Quick Add via Supabase Dashboard

Alternatively, you can add products via the Supabase Dashboard:
1. Go to Supabase Dashboard
2. Click on "Table Editor"
3. Select the `products` table
4. Click "Insert" → "Insert row"
5. Add:
   - name: "Shure SM7B Dynamic Microphone"
   - description: "Professional broadcast dynamic microphone"
   - price: 399.99
   - technical_specs: `{"type": "Dynamic"}`
   - youtube_url: (leave empty)
6. Click "Save"

Repeat for a few more microphone products.
