# Diagnostic Guide for searchInventory Issue

## What to Check

### Step 1: Check Server Console Logs
When you test the search, look for these log messages in your server console (where `npm run dev` is running):

**Good signs:**
```
🔍 searchInventory called with query: "microphones"
✅ searchInventory found X products for query: "microphones"
✅ searchInventory result: X products found
```

**Bad signs:**
```
❌ Error searching inventory: ...
❌ Error code: ...
❌ Exception in searchInventory: ...
⚠️ No products found for query: "microphones"
```

### Step 2: Verify Environment Variables
Make sure these are set in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://dxfukbncszjdwyqhmrgq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Check Products Table
Run this in Supabase SQL Editor:

```sql
-- Check if table exists
SELECT COUNT(*) as product_count FROM products;

-- Check if there's any data
SELECT id, name, description FROM products LIMIT 5;

-- Test the exact query
SELECT * FROM products 
WHERE name ILIKE '%microphone%' OR description ILIKE '%microphone%'
LIMIT 10;
```

### Step 4: Test Database Connection
Create a test API route to verify Supabase connection.

## Common Issues

### Issue 1: Products Table is Empty
**Symptom**: `⚠️ No products found for query: "microphones"` in logs
**Fix**: Add test products to the database

### Issue 2: RLS Policy Blocking Access
**Symptom**: `❌ Error code: 42501` (permission denied)
**Fix**: Check RLS policies allow anonymous reads

### Issue 3: Connection Error
**Symptom**: `❌ Error code: PGRST...` or connection timeout
**Fix**: Verify Supabase URL and API key are correct

### Issue 4: Table Doesn't Exist
**Symptom**: `❌ Error: relation "products" does not exist`
**Fix**: Run the migration to create the products table
