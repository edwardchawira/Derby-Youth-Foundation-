/*
  # Fix Chat Messages RLS Policies

  1. Changes
    - Drop existing policies that incorrectly use auth.uid() directly with musician_id
    - Create new policies that properly join through musician_profiles table
    - Match user_id in musician_profiles with auth.uid()

  2. Security
    - Policies now correctly verify that the authenticated user's ID matches the musician profile's user_id
    - Project collaborators can view and send messages based on their musician_profiles.id
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Project collaborators can view chat messages" ON project_chat_messages;
DROP POLICY IF EXISTS "Project collaborators can send chat messages" ON project_chat_messages;

-- Policy: Project collaborators can view chat messages
CREATE POLICY "Project collaborators can view chat messages"
  ON project_chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators pc
      JOIN musician_profiles mp ON pc.musician_id = mp.id
      WHERE pc.project_id = project_chat_messages.project_id
      AND mp.user_id = auth.uid()
    )
  );

-- Policy: Project collaborators can send chat messages
CREATE POLICY "Project collaborators can send chat messages"
  ON project_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM musician_profiles mp
      WHERE mp.id = musician_id
      AND mp.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM project_collaborators pc
      WHERE pc.project_id = project_chat_messages.project_id
      AND pc.musician_id = musician_id
    )
  );
