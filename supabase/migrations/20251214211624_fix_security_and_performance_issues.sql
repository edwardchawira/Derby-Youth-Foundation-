/*
  # Fix Security and Performance Issues

  ## Changes Made

  1. **Indexes**
     - Add missing index on `equipment_items.category_id` foreign key
     - Remove unused indexes that are not being utilized

  2. **RLS Policy Optimization**
     - Update all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
     - This prevents re-evaluation for each row, improving query performance at scale
     - Affects tables: musician_profiles, musician_skills, musician_bookings, collaboration_requests

  3. **Multiple Permissive Policies**
     - Consolidate overlapping policies where possible
     - Maintain security while reducing policy evaluation overhead

  4. **Function Security**
     - Fix search_path for `update_studio_bookings_updated_at` function to prevent injection attacks

  ## Note
  Auth DB Connection Strategy and Leaked Password Protection should be configured in Supabase dashboard settings.
*/

-- 1. Add missing index for equipment_items foreign key
CREATE INDEX IF NOT EXISTS idx_equipment_items_category_id ON equipment_items(category_id);

-- 2. Drop unused indexes
DROP INDEX IF EXISTS idx_musicians_featured;
DROP INDEX IF EXISTS idx_musicians_available;
DROP INDEX IF EXISTS idx_musician_bookings_status;
DROP INDEX IF EXISTS idx_studio_bookings_email;
DROP INDEX IF EXISTS idx_studio_bookings_stripe_session;
DROP INDEX IF EXISTS idx_studio_bookings_date;
DROP INDEX IF EXISTS idx_studio_bookings_payment_status;

-- 3. Fix RLS policies for musician_profiles
-- Drop existing policies
DROP POLICY IF EXISTS "Musicians can read their own profile" ON musician_profiles;
DROP POLICY IF EXISTS "Musicians can update their own profile" ON musician_profiles;
DROP POLICY IF EXISTS "Musicians can insert their own profile" ON musician_profiles;
DROP POLICY IF EXISTS "Public can view verified active profiles" ON musician_profiles;

-- Recreate with optimized auth calls
CREATE POLICY "Musicians can read their own profile"
  ON musician_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Musicians can update their own profile"
  ON musician_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Musicians can insert their own profile"
  ON musician_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Public can view verified active profiles"
  ON musician_profiles
  FOR SELECT
  TO authenticated
  USING (is_verified = true AND is_active = true);

-- 4. Fix RLS policies for musician_skills
DROP POLICY IF EXISTS "Musicians can read their own skills" ON musician_skills;
DROP POLICY IF EXISTS "Musicians can manage their own skills" ON musician_skills;
DROP POLICY IF EXISTS "Public can view skills of verified musicians" ON musician_skills;

-- Consolidate with optimized auth calls
CREATE POLICY "Musicians can manage their own skills"
  ON musician_skills
  FOR ALL
  TO authenticated
  USING (
    musician_id IN (
      SELECT id FROM musician_profiles 
      WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    musician_id IN (
      SELECT id FROM musician_profiles 
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Public can view skills of verified musicians"
  ON musician_skills
  FOR SELECT
  TO authenticated
  USING (
    musician_id IN (
      SELECT id FROM musician_profiles 
      WHERE is_verified = true AND is_active = true
    )
  );

-- 5. Fix RLS policies for musician_bookings
DROP POLICY IF EXISTS "Musicians can read their own bookings" ON musician_bookings;
DROP POLICY IF EXISTS "Musicians can update their own bookings" ON musician_bookings;

CREATE POLICY "Musicians can read their own bookings"
  ON musician_bookings
  FOR SELECT
  TO authenticated
  USING (
    musician_id IN (
      SELECT id FROM musician_profiles 
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Musicians can update their own bookings"
  ON musician_bookings
  FOR UPDATE
  TO authenticated
  USING (
    musician_id IN (
      SELECT id FROM musician_profiles 
      WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    musician_id IN (
      SELECT id FROM musician_profiles 
      WHERE user_id = (select auth.uid())
    )
  );

-- 6. Fix RLS policies for collaboration_requests
DROP POLICY IF EXISTS "Musicians can read their collaboration requests" ON collaboration_requests;
DROP POLICY IF EXISTS "Musicians can create collaboration requests" ON collaboration_requests;
DROP POLICY IF EXISTS "Musicians can update received collaboration requests" ON collaboration_requests;

CREATE POLICY "Musicians can read their collaboration requests"
  ON collaboration_requests
  FOR SELECT
  TO authenticated
  USING (
    sender_id IN (
      SELECT id FROM musician_profiles 
      WHERE user_id = (select auth.uid())
    )
    OR 
    receiver_id IN (
      SELECT id FROM musician_profiles 
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Musicians can create collaboration requests"
  ON collaboration_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id IN (
      SELECT id FROM musician_profiles 
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Musicians can update received collaboration requests"
  ON collaboration_requests
  FOR UPDATE
  TO authenticated
  USING (
    receiver_id IN (
      SELECT id FROM musician_profiles 
      WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    receiver_id IN (
      SELECT id FROM musician_profiles 
      WHERE user_id = (select auth.uid())
    )
  );

-- 7. Fix musicians table policies (consolidate overlapping policies)
DROP POLICY IF EXISTS "Anyone can view available musicians" ON musicians;
DROP POLICY IF EXISTS "Authenticated users can view all musicians" ON musicians;

-- Single consolidated policy for reading musicians
CREATE POLICY "Users can view musicians"
  ON musicians
  FOR SELECT
  TO authenticated
  USING (true);

-- 8. Fix function search_path for security
-- Drop trigger first, then function
DROP TRIGGER IF EXISTS studio_bookings_updated_at ON studio_bookings;
DROP TRIGGER IF EXISTS update_studio_bookings_updated_at_trigger ON studio_bookings;
DROP FUNCTION IF EXISTS update_studio_bookings_updated_at();

CREATE FUNCTION update_studio_bookings_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER studio_bookings_updated_at
  BEFORE UPDATE ON studio_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_studio_bookings_updated_at();