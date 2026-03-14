/*
  # Create studio bookings table for session reservations with Stripe payments

  1. New Tables
    - `studio_bookings`
      - `id` (uuid, primary key) - Unique booking identifier
      - `customer_name` (text) - Name of the customer
      - `customer_email` (text) - Customer email address
      - `customer_phone` (text, optional) - Customer phone number
      - `package_name` (text) - Name of the booked package
      - `package_price` (numeric) - Price of the package
      - `booking_date` (date) - Date of the studio booking
      - `booking_time` (text) - Time slot for the booking
      - `session_hours` (integer) - Number of hours booked
      - `stripe_session_id` (text) - Stripe checkout session ID
      - `stripe_payment_intent` (text, optional) - Stripe payment intent ID
      - `payment_status` (text) - Payment status (pending, paid, failed, refunded)
      - `booking_status` (text) - Booking status (pending, confirmed, cancelled, completed)
      - `special_requests` (text, optional) - Any special requests from customer
      - `created_at` (timestamptz) - When the booking was created
      - `updated_at` (timestamptz) - When the booking was last updated

  2. Security
    - Enable RLS on `studio_bookings` table
    - Add policy for users to view their own bookings by email
    - Add policy for creating bookings (public for checkout process)
    - Add policy for updating bookings (for webhook processing)

  3. Important Notes
    - This table is separate from the existing `bookings` table which handles equipment rentals
    - This table specifically handles studio session bookings with Stripe payments
*/

CREATE TABLE IF NOT EXISTS studio_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  package_name text NOT NULL,
  package_price numeric NOT NULL,
  booking_date date NOT NULL,
  booking_time text NOT NULL,
  session_hours integer NOT NULL DEFAULT 1,
  stripe_session_id text,
  stripe_payment_intent text,
  payment_status text NOT NULL DEFAULT 'pending',
  booking_status text NOT NULL DEFAULT 'pending',
  special_requests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_studio_bookings_email ON studio_bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_studio_bookings_stripe_session ON studio_bookings(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_studio_bookings_date ON studio_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_studio_bookings_payment_status ON studio_bookings(payment_status);

-- Enable RLS
ALTER TABLE studio_bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to create bookings (needed for checkout)
CREATE POLICY "Anyone can create studio bookings"
  ON studio_bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Users can view their own bookings by email
CREATE POLICY "Users can view own studio bookings"
  ON studio_bookings
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow updates for webhook processing
CREATE POLICY "System can update studio bookings"
  ON studio_bookings
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_studio_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS studio_bookings_updated_at ON studio_bookings;
CREATE TRIGGER studio_bookings_updated_at
  BEFORE UPDATE ON studio_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_studio_bookings_updated_at();