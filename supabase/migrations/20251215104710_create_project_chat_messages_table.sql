/*
  # Create Project Chat Messages Table

  1. New Tables
    - `project_chat_messages`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to collaboration_projects)
      - `musician_id` (uuid, foreign key to musician_profiles)
      - `message_text` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `project_chat_messages` table
    - Add policies for project collaborators to read and create messages

  3. Indexes
    - Add index on project_id for faster queries
    - Add index on created_at for ordering
*/

-- Create project chat messages table
CREATE TABLE IF NOT EXISTS project_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES collaboration_projects(id) ON DELETE CASCADE,
  musician_id uuid NOT NULL REFERENCES musician_profiles(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON project_chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON project_chat_messages(created_at);

-- Policy: Project collaborators can view chat messages
CREATE POLICY "Project collaborators can view chat messages"
  ON project_chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_collaborators.project_id = project_chat_messages.project_id
      AND project_collaborators.musician_id = auth.uid()
    )
  );

-- Policy: Project collaborators can send chat messages
CREATE POLICY "Project collaborators can send chat messages"
  ON project_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    musician_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_collaborators.project_id = project_chat_messages.project_id
      AND project_collaborators.musician_id = auth.uid()
    )
  );
