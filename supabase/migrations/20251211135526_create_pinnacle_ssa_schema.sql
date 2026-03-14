/*
  # Pinnacle SSA Database Schema

  ## Overview
  This migration creates the complete database structure for Pinnacle SSA's equipment hire and studio booking system.

  ## New Tables

  ### 1. equipment_categories
  - `id` (uuid, primary key)
  - `name` (text) - Category name (e.g., "Sound Equipment", "Keyboards")
  - `description` (text) - Category description
  - `created_at` (timestamptz)

  ### 2. equipment_items
  - `id` (uuid, primary key)
  - `name` (text) - Equipment name
  - `category_id` (uuid, foreign key) - Links to equipment_categories
  - `description` (text) - Item description
  - `price_per_day` (decimal) - Daily hire rate
  - `image_url` (text) - Product image URL
  - `available` (boolean) - Availability status
  - `created_at` (timestamptz)

  ### 3. packages
  - `id` (uuid, primary key)
  - `name` (text) - Package name (e.g., "Small Event")
  - `description` (text) - What's included
  - `price_per_day` (decimal) - Package price
  - `features` (jsonb) - Array of features/items included
  - `image_url` (text) - Package image
  - `recommended_capacity` (text) - Event size recommendation
  - `created_at` (timestamptz)

  ### 4. studio_services
  - `id` (uuid, primary key)
  - `name` (text) - Service name (e.g., "Rehearsal Space")
  - `type` (text) - "rehearsal" or "recording"
  - `hourly_rate` (decimal)
  - `four_hour_rate` (decimal)
  - `eight_hour_rate` (decimal)
  - `description` (text)
  - `features` (jsonb) - What's included
  - `created_at` (timestamptz)

  ### 5. bookings
  - `id` (uuid, primary key)
  - `booking_number` (text, unique) - Generated booking reference
  - `customer_name` (text)
  - `customer_email` (text)
  - `customer_phone` (text)
  - `delivery_postcode` (text)
  - `delivery_distance` (decimal) - Calculated miles
  - `delivery_cost` (decimal) - Calculated delivery fee
  - `booking_date` (date) - Date of event/session
  - `duration_days` (integer) - For equipment hire
  - `duration_hours` (decimal) - For studio services
  - `items` (jsonb) - Cart items
  - `subtotal` (decimal)
  - `total` (decimal) - Including delivery
  - `status` (text) - "pending", "confirmed", "completed", "cancelled"
  - `notes` (text)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public read access for equipment, packages, and services
  - Authenticated users can create bookings
  - Only authenticated users can view/manage all bookings (admin)
*/

-- Create equipment_categories table
CREATE TABLE IF NOT EXISTS equipment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create equipment_items table
CREATE TABLE IF NOT EXISTS equipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES equipment_categories(id) ON DELETE SET NULL,
  description text,
  price_per_day decimal(10,2) NOT NULL,
  image_url text,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_per_day decimal(10,2) NOT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  image_url text,
  recommended_capacity text,
  created_at timestamptz DEFAULT now()
);

-- Create studio_services table
CREATE TABLE IF NOT EXISTS studio_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  hourly_rate decimal(10,2) NOT NULL,
  four_hour_rate decimal(10,2),
  eight_hour_rate decimal(10,2),
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  delivery_postcode text,
  delivery_distance decimal(10,2),
  delivery_cost decimal(10,2) DEFAULT 0,
  booking_date date NOT NULL,
  duration_days integer DEFAULT 1,
  duration_hours decimal(10,2),
  items jsonb DEFAULT '[]'::jsonb,
  subtotal decimal(10,2) NOT NULL,
  total decimal(10,2) NOT NULL,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for equipment_categories
CREATE POLICY "Anyone can view equipment categories"
  ON equipment_categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for equipment_items
CREATE POLICY "Anyone can view equipment items"
  ON equipment_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for packages
CREATE POLICY "Anyone can view packages"
  ON packages FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for studio_services
CREATE POLICY "Anyone can view studio services"
  ON studio_services FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for bookings
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert equipment categories
INSERT INTO equipment_categories (name, description) VALUES
  ('Sound Equipment', 'Professional audio equipment for live events'),
  ('Keyboards', 'Professional synthesizers and digital pianos'),
  ('Drums & Percussion', 'Complete drum kits and cymbal packages'),
  ('Mixing Consoles', 'Digital and analog mixing consoles'),
  ('Microphones', 'Wireless and wired microphone systems')
ON CONFLICT DO NOTHING;

-- Insert equipment items
INSERT INTO equipment_items (name, category_id, description, price_per_day, available) VALUES
  ('DW 6 Piece Drumkit', (SELECT id FROM equipment_categories WHERE name = 'Drums & Percussion'), 'Professional DW drum kit with 6 pieces', 180.00, true),
  ('Zildjian Cymbals Package', (SELECT id FROM equipment_categories WHERE name = 'Drums & Percussion'), 'Complete professional cymbal set', 150.00, true),
  ('Yamaha Motif XS7', (SELECT id FROM equipment_categories WHERE name = 'Keyboards'), '76-key professional synthesizer workstation', 150.00, true),
  ('Roland Fantom', (SELECT id FROM equipment_categories WHERE name = 'Keyboards'), 'Next-generation music workstation', 180.00, true),
  ('Yamaha Montage 8', (SELECT id FROM equipment_categories WHERE name = 'Keyboards'), '88-key flagship synthesizer', 220.00, true),
  ('Behringer Wing Console', (SELECT id FROM equipment_categories WHERE name = 'Mixing Consoles'), 'Professional digital mixing console', 200.00, true),
  ('Shure SLXD Wireless Mic', (SELECT id FROM equipment_categories WHERE name = 'Microphones'), 'Professional wireless microphone system', 40.00, true)
ON CONFLICT DO NOTHING;

-- Insert packages
INSERT INTO packages (name, description, price_per_day, features, recommended_capacity) VALUES
  ('Small Event', 'Perfect for intimate gatherings and small venues', 200.00, 
   '["2x 12\" Active Tops", "1x Active Subwoofer", "2x Wired Microphones", "Basic Mixer", "All cables included"]'::jsonb,
   'Up to 100 people'),
  ('Medium Event', 'Ideal for weddings, parties, and corporate events', 450.00,
   '["2x Professional Tops", "2x Active Subwoofers", "2x Wireless Microphones", "Behringer WING Console", "Monitor speakers", "Full cable package"]'::jsonb,
   '100-300 people'),
  ('Large Event', 'Professional setup for concerts and major events', 850.00,
   '["4x Line Array Speakers", "2x Professional Subwoofers", "4x Stage Monitors", "4x Wireless Microphone Systems", "Professional Mixing Console", "Experienced Sound Engineer Included", "Complete cable and power distribution"]'::jsonb,
   '300-800 people'),
  ('Full Production', 'Complete production solution with sound and lighting', 1600.00,
   '["8x Line Array Speaker System", "4x Professional Subwoofers", "8x Stage Monitors", "Full Lighting Rig with Moving Heads", "DMX Controller", "Professional Sound Engineer", "Lighting Technician Assistant", "Complete power and rigging", "Backup equipment included"]'::jsonb,
   '800+ people')
ON CONFLICT DO NOTHING;

-- Insert studio services
INSERT INTO studio_services (name, type, hourly_rate, four_hour_rate, eight_hour_rate, description, features) VALUES
  ('Rehearsal Space', 'rehearsal', 18.00, 60.00, 140.00, 
   'Professional rehearsal space with high-quality equipment',
   '["Full PA System", "Professional Mixer", "Microphones & Stands", "Drum Kit (optional)", "Air Conditioned Space", "Free Parking", "WiFi Access"]'::jsonb),
  ('Recording Studio', 'recording', 30.00, 100.00, 170.00,
   'Professional recording with experienced engineer',
   '["Experienced Recording Engineer Included", "Pro Tools HD System", "Professional Microphones", "Studio Monitoring", "Instrument Backline Available", "Comfortable Control Room", "Mixing from £80 per track"]'::jsonb)
ON CONFLICT DO NOTHING;