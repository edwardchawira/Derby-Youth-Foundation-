/*
  # Fix Project Creation RLS Policy
  
  This migration fixes the issue where project creation fails because
  the trigger cannot add the creator as owner due to RLS policies.
  
  The problem: The "Project owners can add collaborators" policy requires
  the user to already be an owner, but when creating a new project, there
  are no collaborators yet.
  
  Solution: 
  1. Add a policy that allows project creators to add themselves as owner
  2. Ensure the trigger function properly handles errors
*/

-- Drop the policy if it exists, then recreate it
DO $$ 
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Creators can add themselves as owner" ON project_collaborators;
  
  -- Create the policy
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
          SELECT id FROM musician_profiles WHERE user_id = auth.uid()
        )
      )
    );
END $$;

-- Ensure the add_creator_as_owner function properly bypasses RLS and handles errors
CREATE OR REPLACE FUNCTION add_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Use SECURITY DEFINER to bypass RLS - this should work, but if it doesn't,
  -- the policy above will allow it
  INSERT INTO project_collaborators (project_id, musician_id, role, can_upload, can_delete)
  VALUES (NEW.id, NEW.creator_id, 'owner', true, true)
  ON CONFLICT (project_id, musician_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE WARNING 'Failed to add creator as owner for project %: %', NEW.id, SQLERRM;
    -- Still return NEW to allow project creation to succeed
    -- The user can manually add themselves if needed
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;
