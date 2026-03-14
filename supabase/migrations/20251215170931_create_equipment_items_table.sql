/*
  # Create Equipment Items Table

  1. New Tables
    - `equipment_items`
      - `id` (uuid, primary key)
      - `name` (text) - Equipment name
      - `description` (text) - Equipment description
      - `price_per_day` (numeric) - Daily rental price
      - `category_id` (uuid, nullable) - Category reference
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on `equipment_items` table
    - Add policy for anonymous and authenticated users to view equipment

  3. Sample Data
    - Insert common equipment items with prices
*/

CREATE TABLE IF NOT EXISTS equipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price_per_day numeric NOT NULL DEFAULT 0,
  category_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE equipment_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view equipment items" ON equipment_items;
CREATE POLICY "Anyone can view equipment items"
  ON equipment_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert sample equipment items
INSERT INTO equipment_items (name, description, price_per_day) VALUES
  ('Wireless Microphone System', 'Professional wireless mic with receiver', 35),
  ('DJ Controller', 'Professional DJ controller with software', 50),
  ('Fog Machine', 'High output fog machine with fluid', 25),
  ('LED Par Lights (Set of 4)', 'RGBW LED par cans with stands', 40),
  ('Moving Head Lights (Pair)', 'Professional moving head spotlights', 80),
  ('Stage Monitor Speakers', 'Active stage monitors (pair)', 45),
  ('Powered Mixer', '12-channel powered mixer', 55),
  ('Microphone Stand', 'Professional boom microphone stand', 5),
  ('Speaker Stands (Pair)', 'Heavy duty speaker stands', 10),
  ('XLR Cables (10 pack)', 'Professional XLR cables', 15),
  ('DI Box', 'Active direct injection box', 12),
  ('Drum Mic Kit', 'Complete drum miking package', 60)
ON CONFLICT (id) DO NOTHING;
