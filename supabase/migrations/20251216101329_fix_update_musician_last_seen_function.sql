/*
  # Fix update_musician_last_seen Function
  
  The issue: The function `update_musician_last_seen()` is trying to access both
  `NEW.musician_id` and `NEW.uploaded_by`, but different tables have different field names:
  - `project_chat_messages` has `musician_id` (not `uploaded_by`)
  - `project_files` has `uploaded_by` (not `musician_id`)
  - `project_comments` has `musician_id` (not `uploaded_by`)
  
  Solution: Update the function to handle both field names using COALESCE or conditional logic.
*/

-- Fix the update_musician_last_seen function to handle both musician_id and uploaded_by
-- Different tables use different field names, so we need to check which one exists
CREATE OR REPLACE FUNCTION update_musician_last_seen()
RETURNS TRIGGER AS $$
DECLARE
  musician_id_to_update uuid;
BEGIN
  -- Check which table triggered this and get the appropriate field
  IF TG_TABLE_NAME = 'project_files' THEN
    -- project_files uses uploaded_by
    musician_id_to_update := NEW.uploaded_by;
  ELSIF TG_TABLE_NAME = 'project_chat_messages' OR TG_TABLE_NAME = 'project_comments' THEN
    -- These tables use musician_id
    musician_id_to_update := NEW.musician_id;
  END IF;
  
  -- Update last_seen when musician performs any action
  IF musician_id_to_update IS NOT NULL THEN
    UPDATE musician_profiles
    SET last_seen = now()
    WHERE id = musician_id_to_update;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
