/*
  # Fix Collaboration Request Update Policy

  1. Changes
    - Drop existing UPDATE policy on collaboration_requests
    - Create new UPDATE policy that properly checks receiver authentication
    - Add updated_at column if missing
    - Ensure the policy allows receivers to update status

  2. Security
    - Only the receiver can update the collaboration request
    - Authentication is properly verified through user_id match
*/

-- Drop existing update policy
DROP POLICY IF EXISTS "Musicians can update received collaboration requests" ON collaboration_requests;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collaboration_requests' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE collaboration_requests ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create new update policy that allows receivers to update requests
CREATE POLICY "Receivers can update collaboration requests"
  ON collaboration_requests
  FOR UPDATE
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
