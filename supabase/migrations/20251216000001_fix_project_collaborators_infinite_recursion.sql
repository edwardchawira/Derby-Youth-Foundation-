/*
  # Fix Infinite Recursion in project_collaborators Policies
  
  The issue: Policies on `project_collaborators` were checking `project_collaborators` 
  itself, causing infinite recursion when PostgreSQL tries to evaluate the policy.
  
  Solution: Use SECURITY DEFINER functions to bypass RLS when checking collaborator status,
  avoiding circular dependencies in policy evaluation.
*/

-- Create helper function to check if user is a collaborator (bypasses RLS)
CREATE OR REPLACE FUNCTION is_project_collaborator(check_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_collaborators pc
    WHERE pc.project_id = check_project_id
    AND pc.musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = auth.uid()
    )
  );
END;
$$;

-- Create helper function to check if user is a project owner (bypasses RLS)
CREATE OR REPLACE FUNCTION is_project_owner(check_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_collaborators pc
    WHERE pc.project_id = check_project_id
    AND pc.musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = auth.uid()
    )
    AND pc.role = 'owner'
  );
END;
$$;

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Collaborators can view project members" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can add collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can update collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can remove collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Creators can add themselves as owner" ON project_collaborators;

-- Recreate SELECT policy - use helper function to avoid recursion
CREATE POLICY "Collaborators can view project members"
  ON project_collaborators FOR SELECT
  TO authenticated
  USING (is_project_collaborator(project_id));

-- Recreate INSERT policy - allow if user is project owner OR project creator
CREATE POLICY "Project owners can add collaborators"
  ON project_collaborators FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is already an owner of the project (using helper function)
    is_project_owner(project_id)
    -- OR if user is the creator of the project (for initial owner insertion)
    OR EXISTS (
      SELECT 1 FROM collaboration_projects cp
      WHERE cp.id = project_collaborators.project_id
      AND cp.creator_id = project_collaborators.musician_id
      AND cp.creator_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Recreate UPDATE policy - only owners can update
CREATE POLICY "Project owners can update collaborators"
  ON project_collaborators FOR UPDATE
  TO authenticated
  USING (is_project_owner(project_id))
  WITH CHECK (is_project_owner(project_id));

-- Recreate DELETE policy - only owners can remove collaborators
CREATE POLICY "Project owners can remove collaborators"
  ON project_collaborators FOR DELETE
  TO authenticated
  USING (is_project_owner(project_id));

-- The "Creators can add themselves as owner" policy from the previous migration
-- should work, but let's recreate it to be safe
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

