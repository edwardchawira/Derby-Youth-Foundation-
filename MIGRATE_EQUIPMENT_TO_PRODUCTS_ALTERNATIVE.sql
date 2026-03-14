-- Alternative: Migrate equipment_items to products with simpler pricing
-- If you want to keep rental prices or use a different pricing strategy

-- Option 1: Use rental price as purchase price (if same)
INSERT INTO products (name, description, price, technical_specs, created_at)
SELECT 
  ei.name,
  COALESCE(ei.description, 'Professional audio equipment') as description,
  ei.price_per_day as price,  -- Use rental price directly
  jsonb_build_object(
    'equipment_type', 'rental_equipment',
    'rental_price_per_day', ei.price_per_day,
    'original_equipment_id', ei.id
  ) as technical_specs,
  ei.created_at
FROM equipment_items ei
WHERE NOT EXISTS (
  SELECT 1 
  FROM products p 
  WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(ei.name))
)
ON CONFLICT DO NOTHING;

-- Option 2: Use a fixed multiplier (e.g., 10x rental price)
INSERT INTO products (name, description, price, technical_specs, created_at)
SELECT 
  ei.name,
  COALESCE(ei.description, 'Professional audio equipment') as description,
  ROUND((ei.price_per_day * 10)::numeric, 2) as price,  -- 10x rental price
  jsonb_build_object(
    'equipment_type', 'rental_equipment',
    'rental_price_per_day', ei.price_per_day,
    'original_equipment_id', ei.id,
    'pricing_multiplier', 10
  ) as technical_specs,
  ei.created_at
FROM equipment_items ei
WHERE NOT EXISTS (
  SELECT 1 
  FROM products p 
  WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(ei.name))
)
ON CONFLICT DO NOTHING;

-- Option 3: Manual pricing based on equipment type (most control)
INSERT INTO products (name, description, price, technical_specs, created_at)
SELECT 
  ei.name,
  COALESCE(ei.description, 'Professional audio equipment') as description,
  CASE 
    WHEN ei.price_per_day <= 10 THEN ei.price_per_day * 20  -- Cheap items: 20x
    WHEN ei.price_per_day <= 30 THEN ei.price_per_day * 15  -- Medium items: 15x
    WHEN ei.price_per_day <= 60 THEN ei.price_per_day * 12  -- Expensive items: 12x
    ELSE ei.price_per_day * 10  -- Very expensive: 10x
  END as price,
  jsonb_build_object(
    'equipment_type', 'rental_equipment',
    'rental_price_per_day', ei.price_per_day,
    'original_equipment_id', ei.id,
    'pricing_strategy', 'tiered_multiplier'
  ) as technical_specs,
  ei.created_at
FROM equipment_items ei
WHERE NOT EXISTS (
  SELECT 1 
  FROM products p 
  WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(ei.name))
)
ON CONFLICT DO NOTHING;
