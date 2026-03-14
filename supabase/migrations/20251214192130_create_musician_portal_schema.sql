/*
  # Create Musician Portal Schema

  1. New Tables
    - `musician_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `full_name` (text)
      - `email` (text)
      - `role` (text) - e.g., Drummer, Producer, Vocalist
      - `bio` (text)
      - `hourly_rate` (decimal)
      - `session_rate` (decimal)
      - `profile_photo_url` (text)
      - `is_verified` (boolean) - Admin approval status
      - `is_active` (boolean) - Profile active/inactive
      - `open_to_collaboration` (boolean)
      - `total_bookings` (integer)
      - `total_earnings` (decimal)
      - `profile_views` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `musician_skills`
      - `id` (uuid, primary key)
      - `musician_id` (uuid, references musician_profiles)
      - `skill_name` (text) - e.g., Jazz, Gospel, Sight-reading
      - `created_at` (timestamptz)
    
    - `musician_bookings`
      - `id` (uuid, primary key)
      - `musician_id` (uuid, references musician_profiles)
      - `customer_name` (text)
      - `customer_email` (text)
      - `customer_phone` (text)
      - `booking_date` (date)
      - `start_time` (time)
      - `duration_hours` (decimal)
      - `service_type` (text) - e.g., Studio Session, Live Performance
      - `location` (text)
      - `rate` (decimal)
      - `total_amount` (decimal)
      - `status` (text) - pending, accepted, declined, completed, cancelled
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `collaboration_requests`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references musician_profiles)
      - `receiver_id` (uuid, references musician_profiles)
      - `message` (text)
      - `status` (text) - pending, accepted, declined
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Musicians can read their own profiles and bookings
    - Musicians can update their own profiles
    - Public can read verified musician profiles
    - Musicians can create collaboration requests
    - Admin can verify profiles
*/

CREATE TABLE IF NOT EXISTS musician_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  bio text DEFAULT '',
  hourly_rate decimal(10,2) DEFAULT 0,
  session_rate decimal(10,2) DEFAULT 0,
  profile_photo_url text DEFAULT '',
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  open_to_collaboration boolean DEFAULT false,
  total_bookings integer DEFAULT 0,
  total_earnings decimal(10,2) DEFAULT 0,
  profile_views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS musician_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  musician_id uuid REFERENCES musician_profiles(id) ON DELETE CASCADE NOT NULL,
  skill_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS musician_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  musician_id uuid REFERENCES musician_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text DEFAULT '',
  booking_date date NOT NULL,
  start_time time NOT NULL,
  duration_hours decimal(4,2) NOT NULL,
  service_type text NOT NULL,
  location text DEFAULT '',
  rate decimal(10,2) NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collaboration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES musician_profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES musician_profiles(id) ON DELETE CASCADE NOT NULL,
  message text DEFAULT '',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE musician_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE musician_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE musician_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Musicians can read their own profile"
  ON musician_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Musicians can update their own profile"
  ON musician_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Musicians can insert their own profile"
  ON musician_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view verified active profiles"
  ON musician_profiles FOR SELECT
  TO public
  USING (is_verified = true AND is_active = true);

CREATE POLICY "Musicians can read their own skills"
  ON musician_skills FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM musician_profiles
      WHERE musician_profiles.id = musician_skills.musician_id
      AND musician_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Musicians can manage their own skills"
  ON musician_skills FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM musician_profiles
      WHERE musician_profiles.id = musician_skills.musician_id
      AND musician_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM musician_profiles
      WHERE musician_profiles.id = musician_skills.musician_id
      AND musician_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view skills of verified musicians"
  ON musician_skills FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM musician_profiles
      WHERE musician_profiles.id = musician_skills.musician_id
      AND musician_profiles.is_verified = true
      AND musician_profiles.is_active = true
    )
  );

CREATE POLICY "Musicians can read their own bookings"
  ON musician_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM musician_profiles
      WHERE musician_profiles.id = musician_bookings.musician_id
      AND musician_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Musicians can update their own bookings"
  ON musician_bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM musician_profiles
      WHERE musician_profiles.id = musician_bookings.musician_id
      AND musician_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM musician_profiles
      WHERE musician_profiles.id = musician_bookings.musician_id
      AND musician_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can create musician bookings"
  ON musician_bookings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Musicians can read their collaboration requests"
  ON collaboration_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM musician_profiles
      WHERE (musician_profiles.id = collaboration_requests.sender_id
        OR musician_profiles.id = collaboration_requests.receiver_id)
      AND musician_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Musicians can create collaboration requests"
  ON collaboration_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM musician_profiles
      WHERE musician_profiles.id = collaboration_requests.sender_id
      AND musician_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Musicians can update received collaboration requests"
  ON collaboration_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM musician_profiles
      WHERE musician_profiles.id = collaboration_requests.receiver_id
      AND musician_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM musician_profiles
      WHERE musician_profiles.id = collaboration_requests.receiver_id
      AND musician_profiles.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_musician_profiles_user_id ON musician_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_musician_profiles_verified ON musician_profiles(is_verified, is_active);
CREATE INDEX IF NOT EXISTS idx_musician_skills_musician_id ON musician_skills(musician_id);
CREATE INDEX IF NOT EXISTS idx_musician_bookings_musician_id ON musician_bookings(musician_id);
CREATE INDEX IF NOT EXISTS idx_musician_bookings_status ON musician_bookings(status);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_sender ON collaboration_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_receiver ON collaboration_requests(receiver_id);
