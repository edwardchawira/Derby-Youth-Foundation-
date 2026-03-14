/*
  # Fix stage_name references in database functions

  1. Changes
    - Updates `auto_create_project_on_collab_accept` function to use `full_name` instead of `stage_name`
    - The musician_profiles table uses `full_name`, not `stage_name`

  2. Notes
    - This function is likely not being used anymore since we created a new accept function
    - But fixing it to prevent errors
*/

-- Fix auto_create_project_on_collab_accept to use full_name instead of stage_name
CREATE OR REPLACE FUNCTION auto_create_project_on_collab_accept()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO collaboration_projects (project_name, description, creator_id, status)
    VALUES (
      'Collaboration: ' || (SELECT full_name FROM musician_profiles WHERE id = NEW.sender_id LIMIT 1) || 
      ' & ' || (SELECT full_name FROM musician_profiles WHERE id = NEW.receiver_id LIMIT 1),
      'Auto-generated project from collaboration request',
      NEW.receiver_id,
      'active'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;
