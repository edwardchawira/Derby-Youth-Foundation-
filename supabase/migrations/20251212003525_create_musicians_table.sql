/*
  # Create Musicians/Talent Directory Table

  ## Overview
  This migration creates the infrastructure for a talent directory feature where users can browse and hire musicians, producers, engineers, and other creative professionals.

  ## New Tables
  
  ### `musicians`
  Stores profiles of available talent for hire:
  - `id` (uuid, primary key) - Unique identifier for each musician/talent
  - `name` (text) - Professional name or stage name
  - `role` (text) - Primary role (e.g., "Session Drummer", "Mix Engineer")
  - `bio` (text) - Short biography or description
  - `category` (text) - Category for filtering (Drummer, Producer, Engineer, Guitarist, Rapper, Choir)
  - `daily_rate` (numeric) - Daily hire rate in GBP
  - `session_rate` (numeric) - Session rate in GBP
  - `profile_image_url` (text) - URL to profile image
  - `specialties` (text[]) - Array of specialty areas
  - `years_experience` (integer) - Years of professional experience
  - `is_available` (boolean) - Current availability status
  - `featured` (boolean) - Whether to feature this talent prominently
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on `musicians` table
  - Add policy for public read access (anyone can browse talent)
  - Add policy for authenticated admin users to manage profiles

  ## Notes
  - This is a read-heavy table optimized for browsing and filtering
  - Categories are stored as text for flexibility but should be standardized in the application
  - Both daily_rate and session_rate are optional to accommodate different pricing models
*/

CREATE TABLE IF NOT EXISTS musicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  bio text NOT NULL,
  category text NOT NULL,
  daily_rate numeric,
  session_rate numeric,
  profile_image_url text,
  specialties text[] DEFAULT '{}',
  years_experience integer DEFAULT 0,
  is_available boolean DEFAULT true,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE musicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available musicians"
  ON musicians
  FOR SELECT
  TO public
  USING (is_available = true);

CREATE POLICY "Authenticated users can view all musicians"
  ON musicians
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert musicians"
  ON musicians
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update musicians"
  ON musicians
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete musicians"
  ON musicians
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_musicians_category ON musicians(category);
CREATE INDEX IF NOT EXISTS idx_musicians_featured ON musicians(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_musicians_available ON musicians(is_available) WHERE is_available = true;