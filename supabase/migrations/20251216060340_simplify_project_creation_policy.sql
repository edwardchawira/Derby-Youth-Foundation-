/*
  # Simplify Project Creation Policy
  
  This migration simplifies the INSERT policy for collaboration_projects by:
  1. Dropping all existing INSERT policies
  2. Creating a simplified policy that only checks if the user is verified
     (removes the is_active check for more straightforward validation)
*/

-- Drop ALL existing INSERT policies
DROP POLICY IF EXISTS "Musicians can create projects" ON collaboration_projects;
DROP POLICY IF EXISTS "Verified musicians can create projects" ON collaboration_projects;

-- Create a simple INSERT policy that only checks if user is verified
CREATE POLICY "Verified musicians can create projects"
  ON collaboration_projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM musician_profiles 
      WHERE id = creator_id
      AND user_id = auth.uid()
      AND is_verified = true
    )
  );