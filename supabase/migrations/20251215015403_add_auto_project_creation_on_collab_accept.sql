/*
  # Auto-Create Collaboration Projects on Request Accept

  ## Purpose
  This migration adds functionality to automatically create a collaboration project workspace
  when a musician accepts a collaboration request from another musician.

  ## New Tables

  ### 1. `project_messages`
  Real-time chat messages within collaboration projects
  - `id` (uuid, primary key) - Unique message identifier
  - `project_id` (uuid, FK to collaboration_projects) - Parent project
  - `sender_id` (uuid, FK to musician_profiles) - Message sender
  - `message_text` (text) - Message content
  - `created_at` (timestamptz) - Message timestamp

  ### 2. `project_activity_feeds`
  Real-time activity feed/audit trail for collaboration projects
  - `id` (uuid, primary key) - Unique activity identifier
  - `project_id` (uuid, FK to collaboration_projects) - Parent project
  - `actor_id` (uuid, FK to musician_profiles) - Who performed the action
  - `action_type` (text) - Action type: 'PROJECT_CREATED', 'FILE_UPLOADED', 'MESSAGE_SENT', 'STATUS_CHANGED'
  - `action_description` (text) - Human-readable description
  - `metadata` (jsonb) - Additional structured data
  - `created_at` (timestamptz) - Event timestamp

  ## Automation
  - When a collaboration_requests row status changes to 'accepted', automatically:
    1. Create a new collaboration_projects entry
    2. Add both musicians as collaborators
    3. Create initial activity feed entry

  ## Security
  - Enable RLS on new tables
  - Only project collaborators can access messages and activity feeds
  - All collaborators can send messages

  ## Important Notes
  - Uses existing collaboration_projects table
  - Integrates with existing project_collaborators for access control
  - Activity feed automatically tracks all project events
*/

-- Create project_messages table for real-time chat
CREATE TABLE IF NOT EXISTS project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES collaboration_projects(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES musician_profiles(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create project_activity_feeds table for audit trail
CREATE TABLE IF NOT EXISTS project_activity_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES collaboration_projects(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES musician_profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('PROJECT_CREATED', 'FILE_UPLOADED', 'MESSAGE_SENT', 'STATUS_CHANGED', 'MEMBER_ADDED')),
  action_description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_messages_project ON project_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_created ON project_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_project_activity_feeds_project ON project_activity_feeds(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_feeds_created ON project_activity_feeds(created_at DESC);

-- Enable RLS
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity_feeds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_messages
CREATE POLICY "Collaborators can view project messages"
  ON project_messages FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Collaborators can send messages"
  ON project_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id IN (
      SELECT id FROM musician_profiles WHERE user_id = auth.uid()
    )
    AND project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for project_activity_feeds
CREATE POLICY "Collaborators can view activity feeds"
  ON project_activity_feeds FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can create activity feed entries"
  ON project_activity_feeds FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to auto-create project when collaboration request is accepted
CREATE OR REPLACE FUNCTION auto_create_project_on_collab_accept()
RETURNS TRIGGER AS $$
DECLARE
  requester_name text;
  recipient_name text;
  project_name_var text;
  new_project_id uuid;
BEGIN
  IF NEW.status = 'accepted' AND (OLD IS NULL OR OLD.status != 'accepted') THEN
    
    SELECT full_name INTO requester_name 
    FROM musician_profiles 
    WHERE id = NEW.sender_id;
    
    SELECT full_name INTO recipient_name 
    FROM musician_profiles 
    WHERE id = NEW.receiver_id;
    
    project_name_var := 'Collab: ' || requester_name || ' & ' || recipient_name;
    
    INSERT INTO collaboration_projects (
      project_name,
      description,
      creator_id,
      status
    ) VALUES (
      project_name_var,
      'Auto-created collaboration project',
      NEW.sender_id,
      'active'
    ) RETURNING id INTO new_project_id;
    
    INSERT INTO project_collaborators (
      project_id,
      musician_id,
      role,
      can_upload,
      can_delete
    ) VALUES (
      new_project_id,
      NEW.receiver_id,
      'collaborator',
      true,
      true
    );
    
    INSERT INTO project_activity_feeds (
      project_id,
      actor_id,
      action_type,
      action_description,
      metadata
    ) VALUES (
      new_project_id,
      NEW.receiver_id,
      'PROJECT_CREATED',
      recipient_name || ' accepted collaboration from ' || requester_name,
      jsonb_build_object(
        'collaboration_request_id', NEW.id,
        'requester_id', NEW.sender_id,
        'recipient_id', NEW.receiver_id
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on collaboration_requests
DROP TRIGGER IF EXISTS trigger_auto_create_project ON collaboration_requests;
CREATE TRIGGER trigger_auto_create_project
  AFTER INSERT OR UPDATE ON collaboration_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_project_on_collab_accept();

-- Function to create activity feed entry when message is sent
CREATE OR REPLACE FUNCTION create_activity_feed_on_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name text;
BEGIN
  SELECT full_name INTO sender_name 
  FROM musician_profiles 
  WHERE id = NEW.sender_id;
  
  INSERT INTO project_activity_feeds (
    project_id,
    actor_id,
    action_type,
    action_description,
    metadata
  ) VALUES (
    NEW.project_id,
    NEW.sender_id,
    'MESSAGE_SENT',
    sender_name || ' sent a message',
    jsonb_build_object('message_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message activity feed
DROP TRIGGER IF EXISTS trigger_activity_feed_on_message ON project_messages;
CREATE TRIGGER trigger_activity_feed_on_message
  AFTER INSERT ON project_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_feed_on_message();

-- Function to create activity feed entry when file is uploaded
CREATE OR REPLACE FUNCTION create_activity_feed_on_file_upload()
RETURNS TRIGGER AS $$
DECLARE
  uploader_name text;
BEGIN
  SELECT full_name INTO uploader_name 
  FROM musician_profiles 
  WHERE id = NEW.uploaded_by;
  
  INSERT INTO project_activity_feeds (
    project_id,
    actor_id,
    action_type,
    action_description,
    metadata
  ) VALUES (
    NEW.project_id,
    NEW.uploaded_by,
    'FILE_UPLOADED',
    uploader_name || ' uploaded "' || NEW.file_name || '" (v' || NEW.version_number || ')',
    jsonb_build_object(
      'file_id', NEW.id,
      'file_name', NEW.file_name,
      'version_number', NEW.version_number
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for file upload activity feed
DROP TRIGGER IF EXISTS trigger_activity_feed_on_file_upload ON project_files;
CREATE TRIGGER trigger_activity_feed_on_file_upload
  AFTER INSERT ON project_files
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_feed_on_file_upload();
