/*
  # Fix Recursive Policy on project_collaborators Table

  1. Problem
    - The SELECT policy on project_collaborators references itself, causing infinite recursion
    - This blocks ALL storage operations, including profile photo uploads

  2. Solution
    - Drop the recursive SELECT policy
    - Create a new non-recursive policy that directly checks musician ownership
    - Simplify the policy to avoid self-referencing queries

  3. Security
    - Maintains same access control: collaborators can only see projects they're part of
    - Removes the infinite recursion by not querying project_collaborators within its own policy
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Collaborators can view project members" ON project_collaborators;

-- Create a new non-recursive policy
-- This policy allows users to see collaborator records where they themselves are a collaborator
CREATE POLICY "Users can view their project collaborations"
  ON project_collaborators
  FOR SELECT
  TO authenticated
  USING (
    musician_id IN (
      SELECT id FROM musician_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Also drop and recreate the INSERT policy to be simpler and avoid potential recursion
DROP POLICY IF EXISTS "Project owners can add collaborators" ON project_collaborators;

CREATE POLICY "Project owners can add collaborators"
  ON project_collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collaboration_projects
      WHERE id = project_id
      AND creator_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Fix UPDATE policy to avoid recursion
DROP POLICY IF EXISTS "Project owners can update collaborators" ON project_collaborators;

CREATE POLICY "Project owners can update collaborators"
  ON project_collaborators
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaboration_projects
      WHERE id = project_id
      AND creator_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collaboration_projects
      WHERE id = project_id
      AND creator_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Fix DELETE policy to avoid recursion
DROP POLICY IF EXISTS "Project owners can remove collaborators" ON project_collaborators;

CREATE POLICY "Project owners can remove collaborators"
  ON project_collaborators
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaboration_projects
      WHERE id = project_id
      AND creator_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
    )
  );
