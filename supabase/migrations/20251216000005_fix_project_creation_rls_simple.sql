/*
  # Simple Fix for Project Creation RLS Policy
  
  This is a simpler, more direct fix that ensures verified musicians can create projects.
  It removes the is_active requirement since that field may not be consistently set.
*/

-- Drop ALL existing INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "Musicians can create projects" ON collaboration_projects;
DROP POLICY IF EXISTS "Verified musicians can create projects" ON collaboration_projects;

-- Create a simple INSERT policy that only checks if user is verified
CREATE POLICY "Verified musicians can create projects"
  ON collaboration_projects FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Simply check that creator_id matches authenticated user's musician profile
    -- and that the musician is verified
    EXISTS (
      SELECT 1 FROM musician_profiles 
      WHERE id = creator_id
      AND user_id = auth.uid()
      AND is_verified = true
    )
  );





