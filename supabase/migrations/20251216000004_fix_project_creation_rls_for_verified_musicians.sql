/*
  # Fix Project Creation RLS Policy for Verified Musicians
  
  This migration fixes the issue where verified musicians cannot create projects
  due to RLS policy restrictions.
  
  The problem: The INSERT policy for collaboration_projects may not be properly
  checking if the musician is verified and active.
  
  Solution: 
  1. Update the INSERT policy to ensure only verified and active musicians can create projects
  2. Ensure the policy properly validates the creator_id matches the authenticated user
*/

-- Drop ALL existing INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "Musicians can create projects" ON collaboration_projects;
DROP POLICY IF EXISTS "Verified musicians can create projects" ON collaboration_projects;

-- Create a new INSERT policy that checks for verified musicians
-- This policy allows verified musicians to create projects
-- Note: is_active check is optional as it may not be set for all users
CREATE POLICY "Verified musicians can create projects"
  ON collaboration_projects FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Ensure the creator_id matches the authenticated user's musician profile
    -- AND that the musician is verified (is_active is optional)
    EXISTS (
      SELECT 1 FROM musician_profiles 
      WHERE id = creator_id
      AND user_id = auth.uid()
      AND is_verified = true
      AND (is_active = true OR is_active IS NULL)
    )
  );

-- Ensure the add_creator_as_owner function is properly set up
CREATE OR REPLACE FUNCTION add_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Use SECURITY DEFINER to bypass RLS
  INSERT INTO project_collaborators (project_id, musician_id, role, can_upload, can_delete)
  VALUES (NEW.id, NEW.creator_id, 'owner', true, true)
  ON CONFLICT (project_id, musician_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE WARNING 'Failed to add creator as owner for project %: %', NEW.id, SQLERRM;
    -- Still return NEW to allow project creation to succeed
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_project_created ON collaboration_projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON collaboration_projects
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_owner();

-- Ensure the policy for creators to add themselves as owner exists
DROP POLICY IF EXISTS "Creators can add themselves as owner" ON project_collaborators;
CREATE POLICY "Creators can add themselves as owner"
  ON project_collaborators FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if the musician is the creator of the project
    EXISTS (
      SELECT 1 FROM collaboration_projects cp
      WHERE cp.id = project_collaborators.project_id
      AND cp.creator_id = project_collaborators.musician_id
      AND cp.creator_id IN (
        SELECT id FROM musician_profiles 
        WHERE user_id = auth.uid()
        AND is_verified = true
        AND is_active = true
      )
    )
  );

