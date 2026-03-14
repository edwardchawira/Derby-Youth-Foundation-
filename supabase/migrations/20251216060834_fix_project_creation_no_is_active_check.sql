/*
  # Fix Project Creation RLS Policy - No is_active Check
  
  This migration removes the is_active requirement from the INSERT policy
  to allow verified musicians to create projects regardless of is_active status.
*/

-- Drop ALL existing INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "Musicians can create projects" ON collaboration_projects;
DROP POLICY IF EXISTS "Verified musicians can create projects" ON collaboration_projects;

-- Create a simple INSERT policy that only checks if user is verified
-- This removes the is_active check which may be preventing project creation
CREATE POLICY "Verified musicians can create projects"
  ON collaboration_projects FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Simply check that creator_id matches authenticated user's musician profile
    -- and that the musician is verified (no is_active check)
    EXISTS (
      SELECT 1 FROM musician_profiles 
      WHERE id = creator_id
      AND user_id = auth.uid()
      AND is_verified = true
    )
  );