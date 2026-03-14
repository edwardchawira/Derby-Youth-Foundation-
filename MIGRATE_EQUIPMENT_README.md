# Migrate Equipment Items to Products

## Overview
This SQL will copy all equipment from the `equipment_items` table to the `products` table so they appear in the AI assistant search.

## Choose Your Pricing Strategy

### Option 1: Simple 12x Multiplier (Recommended)
- Rental price × 12 = Purchase price
- Example: £35/day → £420 purchase price
- **Use**: `MIGRATE_EQUIPMENT_TO_PRODUCTS.sql`

### Option 2: Use Rental Price as Purchase Price
- Purchase price = Rental price per day
- **Use**: First INSERT in `MIGRATE_EQUIPMENT_TO_PRODUCTS_ALTERNATIVE.sql`
- ⚠️ Note: This makes items very cheap!

### Option 3: 10x Multiplier
- Rental price × 10 = Purchase price
- **Use**: Second INSERT in `MIGRATE_EQUIPMENT_TO_PRODUCTS_ALTERNATIVE.sql`

### Option 4: Tiered Pricing (Most Control)
- Cheap items (≤£10/day): 20x multiplier
- Medium items (£11-30/day): 15x multiplier  
- Expensive items (£31-60/day): 12x multiplier
- Very expensive (>£60/day): 10x multiplier
- **Use**: Third INSERT in `MIGRATE_EQUIPMENT_TO_PRODUCTS_ALTERNATIVE.sql`

## How to Run

1. **Go to Supabase Dashboard**
2. **Open SQL Editor**
3. **Choose one of the SQL files** (recommended: `MIGRATE_EQUIPMENT_TO_PRODUCTS.sql`)
4. **Copy and paste the INSERT statement** (not the SELECT statements)
5. **Click "Run"**

## What Gets Migrated

- **name** → name
- **description** → description  
- **price_per_day** → price (with multiplier)
- **id** → stored in technical_specs as `original_equipment_id`
- **price_per_day** → stored in technical_specs as `rental_price_per_day`
- **created_at** → created_at

## Duplicate Prevention

The SQL checks for existing products with the same name (case-insensitive) to avoid duplicates.

## After Migration

1. Verify products were added:
```sql
SELECT COUNT(*) FROM products 
WHERE technical_specs->>'equipment_type' = 'rental_equipment';
```

2. Test the AI assistant search:
- Search for "wireless microphone"
- Search for "drum kit"
- Search for "mixer"

3. Adjust prices if needed:
```sql
UPDATE products 
SET price = price * 1.5  -- Increase all by 50%
WHERE technical_specs->>'equipment_type' = 'rental_equipment';
```

## Example Equipment Being Migrated

Based on your schema, these items will be migrated:
- Wireless Microphone System
- DJ Controller
- Fog Machine
- LED Par Lights
- Moving Head Lights
- Stage Monitor Speakers
- Powered Mixer
- Microphone Stand
- Speaker Stands
- XLR Cables
- DI Box
- Drum Mic Kit
- DW 6 Piece Drumkit
- Zildjian Cymbals Package
- Yamaha Motif XS7
- Roland Fantom
- Yamaha Montage 8
- Behringer Wing Console
- Shure SLXD Wireless Mic

## Notes

- The `technical_specs` field stores rental information so you can reference back to the original equipment
- Products can be searched by the AI assistant
- You can still keep `equipment_items` for rental bookings
- Both tables can coexist - products for sale, equipment_items for rental
