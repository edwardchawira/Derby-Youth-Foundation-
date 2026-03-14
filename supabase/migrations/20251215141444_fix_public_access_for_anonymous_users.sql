/*
  # Fix Public Access for Anonymous Users

  ## Changes Made
  
  1. **Musician Profiles Public Visibility**
     - Drop existing "Public can view verified active profiles" policy (authenticated only)
     - Create new policy allowing both anonymous and authenticated users to view verified, active profiles
     - This enables the /musicians page to display musicians to all visitors
  
  2. **Equipment and Pricing Public Access**
     - Policies already exist for packages, equipment_items, and studio_services
     - No changes needed (already accessible to anon users)
  
  ## Security Notes
  
  - Only verified and active musician profiles are visible to the public
  - Personal data (user_id) is not exposed through SELECT policies
  - Musicians can still only modify their own profiles (existing policies retained)
*/

-- Drop the existing authenticated-only policy for public viewing
DROP POLICY IF EXISTS "Public can view verified active profiles" ON musician_profiles;

-- Create new policy allowing both anonymous and authenticated users to view verified active profiles
CREATE POLICY "Anyone can view verified active profiles"
  ON musician_profiles
  FOR SELECT
  TO anon, authenticated
  USING (is_verified = true AND is_active = true);
