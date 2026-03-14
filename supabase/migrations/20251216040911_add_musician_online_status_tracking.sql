/*
  # Add Online Status Tracking for Musicians
  
  This migration adds tracking for when musicians are logged in and online.
  We'll track last_seen timestamp and update it when users are active.
*/

-- Add last_seen timestamp to musician_profiles
ALTER TABLE musician_profiles
ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_musician_profiles_last_seen 
ON musician_profiles(last_seen DESC);

-- Function to update last_seen timestamp
CREATE OR REPLACE FUNCTION update_musician_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_seen when musician performs any action
  UPDATE musician_profiles
  SET last_seen = now()
  WHERE id = NEW.musician_id OR id = NEW.uploaded_by;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to update last_seen on activity
DROP TRIGGER IF EXISTS update_last_seen_on_message ON project_chat_messages;
CREATE TRIGGER update_last_seen_on_message
  AFTER INSERT ON project_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_musician_last_seen();

DROP TRIGGER IF EXISTS update_last_seen_on_file ON project_files;
CREATE TRIGGER update_last_seen_on_file
  AFTER INSERT ON project_files
  FOR EACH ROW
  EXECUTE FUNCTION update_musician_last_seen();

DROP TRIGGER IF EXISTS update_last_seen_on_comment ON project_comments;
CREATE TRIGGER update_last_seen_on_comment
  AFTER INSERT ON project_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_musician_last_seen();

-- Function to update last_seen on login (called from client)
CREATE OR REPLACE FUNCTION update_musician_last_seen_on_login(musician_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE musician_profiles
  SET last_seen = now()
  WHERE user_id = musician_user_id;
END;
$$;