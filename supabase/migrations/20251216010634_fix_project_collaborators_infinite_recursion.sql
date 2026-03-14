/*
  # Fix Infinite Recursion in Project Collaborators Policies
  
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

-- Drop existing policies that have circular dependencies
DROP POLICY IF EXISTS "Collaborators can view project members" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can add collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can update collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can remove collaborators" ON project_collaborators;

-- Recreate policies using helper functions (no more circular dependencies)
CREATE POLICY "Collaborators can view project members"
  ON project_collaborators FOR SELECT
  TO authenticated
  USING (is_project_collaborator(project_id));

CREATE POLICY "Project owners can add collaborators"
  ON project_collaborators FOR INSERT
  TO authenticated
  WITH CHECK (is_project_owner(project_id));

CREATE POLICY "Project owners can update collaborators"
  ON project_collaborators FOR UPDATE
  TO authenticated
  USING (is_project_owner(project_id))
  WITH CHECK (is_project_owner(project_id));

CREATE POLICY "Project owners can remove collaborators"
  ON project_collaborators FOR DELETE
  TO authenticated
  USING (is_project_owner(project_id));
