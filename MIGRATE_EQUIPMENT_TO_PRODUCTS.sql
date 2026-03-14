-- Migrate all equipment_items to products table
-- This will copy equipment items and convert them to products for sale

-- First, check what equipment items exist
SELECT 
  COUNT(*) as total_equipment,
  COUNT(DISTINCT name) as unique_names
FROM equipment_items;

-- Migrate equipment_items to products table
-- Note: price_per_day becomes price (selling price)
-- We'll also include rental info in technical_specs
INSERT INTO products (name, description, price, technical_specs, created_at)
SELECT 
  ei.name,
  COALESCE(ei.description, 'Professional audio equipment for hire and purchase') as description,
  -- Convert rental price to purchase price (multiply by ~10-15x for typical markup)
  -- Adjust multiplier as needed for your pricing strategy
  ROUND((ei.price_per_day * 12)::numeric, 2) as price,
  jsonb_build_object(
    'equipment_type', 'rental_equipment',
    'rental_price_per_day', ei.price_per_day,
    'category_id', ei.category_id,
    'available', COALESCE(ei.available, true),
    'original_equipment_id', ei.id
  ) as technical_specs,
  ei.created_at
FROM equipment_items ei
WHERE NOT EXISTS (
  -- Avoid duplicates: check if product with same name already exists
  SELECT 1 
  FROM products p 
  WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(ei.name))
)
ON CONFLICT DO NOTHING;

-- Verify the migration
SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE technical_specs->>'equipment_type' = 'rental_equipment') as migrated_equipment
FROM products;

-- Show migrated products
SELECT 
  id,
  name,
  description,
  price,
  technical_specs->>'rental_price_per_day' as rental_price_per_day,
  technical_specs->>'equipment_type' as equipment_type
FROM products
WHERE technical_specs->>'equipment_type' = 'rental_equipment'
ORDER BY name;
