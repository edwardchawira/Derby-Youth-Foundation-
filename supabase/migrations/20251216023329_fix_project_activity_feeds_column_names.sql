/*
  # Fix project_activity_feeds Column Names
  
  The issue: The function `create_activity_feed_on_file_upload` is trying to insert
  into `project_activity_feeds` using incorrect column names:
  - Using `activity_type` instead of `action_type`
  - Using `activity_data` instead of `metadata`
  
  The table `project_activity_feeds` has columns:
  - action_type (not activity_type)
  - metadata (not activity_data)
  - action_description (required)
  
  Solution: Fix the function to use the correct column names.
*/

-- Fix create_activity_feed_on_file_upload function
CREATE OR REPLACE FUNCTION create_activity_feed_on_file_upload()
RETURNS TRIGGER AS $$
DECLARE
  uploader_name text;
BEGIN
  -- Get uploader name for action_description
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
    COALESCE(uploader_name, 'Unknown') || ' uploaded "' || NEW.file_name || '" (v' || NEW.version_number || ')',
    jsonb_build_object(
      'file_id', NEW.id,
      'file_name', NEW.file_name,
      'file_type', NEW.file_type,
      'version_number', NEW.version_number
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix create_activity_feed_on_message function
CREATE OR REPLACE FUNCTION create_activity_feed_on_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name text;
BEGIN
  -- Get sender name for action_description
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
    COALESCE(sender_name, 'Unknown') || ' sent a message',
    jsonb_build_object(
      'message_id', NEW.id,
      'message_preview', LEFT(NEW.message_text, 100)
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;
