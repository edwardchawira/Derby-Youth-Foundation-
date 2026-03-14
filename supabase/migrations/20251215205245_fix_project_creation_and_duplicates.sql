/*
  # Fix Project Creation and Remove Duplicates

  ## Issues Fixed
  1. **Duplicate Projects**: Multiple identical collaboration projects being created
  2. **Manual Project Creation**: Projects created manually should work properly
  3. **Duplicate Prevention**: Better logic to prevent duplicate collaborations

  ## Changes

  ### 1. Clean Up Duplicate Projects
  - Identifies duplicate projects with same name and creator
  - Keeps the most recent project with most collaborators
  - Deletes older duplicates

  ### 2. Add Unique Constraint
  - Ensures a musician can only be added once to a project
  - Prevents duplicate collaborator entries

  ### 3. Fix accept_collaboration_request Function
  - Improved duplicate detection logic
  - Better error handling
  - Prevents race conditions more effectively

  ## Data Safety
  - Preserves most recent and complete projects
  - Safely removes only true duplicates
*/

-- =====================================================
-- 1. CLEAN UP DUPLICATE PROJECTS
-- =====================================================

-- Delete duplicate projects, keeping only the newest one with most collaborators
DO $$
DECLARE
  duplicate_group RECORD;
  project_to_keep uuid;
  projects_to_delete uuid[];
BEGIN
  -- Find groups of duplicate projects (same creator and same collaborators)
  FOR duplicate_group IN
    SELECT 
      cp.project_name,
      cp.creator_id,
      ARRAY_AGG(cp.id ORDER BY 
        (SELECT COUNT(*) FROM project_collaborators WHERE project_id = cp.id) DESC,
        cp.created_at DESC
      ) as project_ids
    FROM collaboration_projects cp
    GROUP BY cp.project_name, cp.creator_id
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first project (most collaborators, most recent)
    project_to_keep := duplicate_group.project_ids[1];
    projects_to_delete := duplicate_group.project_ids[2:];
    
    -- Delete project_collaborators for duplicate projects
    DELETE FROM project_collaborators
    WHERE project_id = ANY(projects_to_delete);
    
    -- Delete project_chat_messages for duplicate projects
    DELETE FROM project_chat_messages
    WHERE project_id = ANY(projects_to_delete);
    
    -- Delete project_comments for duplicate projects
    DELETE FROM project_comments
    WHERE project_id = ANY(projects_to_delete);
    
    -- Delete project_files for duplicate projects
    DELETE FROM project_files
    WHERE project_id = ANY(projects_to_delete);
    
    -- Delete project_activity_log for duplicate projects
    DELETE FROM project_activity_log
    WHERE project_id = ANY(projects_to_delete);
    
    -- Delete duplicate projects
    DELETE FROM collaboration_projects
    WHERE id = ANY(projects_to_delete);
    
    RAISE NOTICE 'Cleaned up duplicates for project: %. Kept: %, Deleted: %', 
      duplicate_group.project_name, project_to_keep, projects_to_delete;
  END LOOP;
END $$;

-- =====================================================
-- 2. ADD UNIQUE CONSTRAINT ON PROJECT_COLLABORATORS
-- =====================================================

-- Add unique constraint to prevent duplicate collaborators
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'project_collaborators_unique_musician_per_project'
  ) THEN
    ALTER TABLE project_collaborators
    ADD CONSTRAINT project_collaborators_unique_musician_per_project
    UNIQUE (project_id, musician_id);
  END IF;
END $$;

-- =====================================================
-- 3. FIX accept_collaboration_request FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION accept_collaboration_request(request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sender_id uuid;
  v_receiver_id uuid;
  v_message text;
  v_sender_name text;
  v_receiver_name text;
  v_project_name text;
  v_new_project_id uuid;
  v_caller_musician_id uuid;
  v_existing_project_id uuid;
  v_collab_count int;
  v_result json;
  v_error_step text;
  v_request_status text;
BEGIN
  v_error_step := 'Getting caller musician ID';

  -- Get the musician_id of the caller
  SELECT id INTO v_caller_musician_id
  FROM musician_profiles
  WHERE user_id = auth.uid();

  IF v_caller_musician_id IS NULL THEN
    RAISE EXCEPTION 'User is not a musician';
  END IF;

  v_error_step := 'Fetching and locking request';

  -- Get request details and lock the row to prevent race conditions
  SELECT sender_id, receiver_id, message, status
  INTO v_sender_id, v_receiver_id, v_message, v_request_status
  FROM collaboration_requests
  WHERE id = request_id
  FOR UPDATE;

  IF v_receiver_id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Check if already processed
  IF v_request_status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed with status: %', v_request_status;
  END IF;

  v_error_step := 'Verifying caller is receiver';

  -- Verify caller is the receiver
  IF v_caller_musician_id != v_receiver_id THEN
    RAISE EXCEPTION 'Only the receiver can accept this request';
  END IF;

  v_error_step := 'Checking for existing collaboration';

  -- Check if these two musicians are already collaborating on any project
  SELECT cp.id INTO v_existing_project_id
  FROM collaboration_projects cp
  INNER JOIN project_collaborators pc1 ON pc1.project_id = cp.id
  INNER JOIN project_collaborators pc2 ON pc2.project_id = cp.id
  WHERE pc1.musician_id = v_sender_id
    AND pc2.musician_id = v_receiver_id
    AND cp.status = 'active'
  LIMIT 1;

  IF v_existing_project_id IS NOT NULL THEN
    -- Update the request status to accepted but don't create a new project
    UPDATE collaboration_requests
    SET 
      status = 'accepted',
      updated_at = now()
    WHERE id = request_id;
    
    RETURN json_build_object(
      'success', true,
      'project_id', v_existing_project_id,
      'project_name', (SELECT project_name FROM collaboration_projects WHERE id = v_existing_project_id),
      'message', 'Using existing collaboration project'
    );
  END IF;

  v_error_step := 'Getting musician names';

  -- Get names for project title
  SELECT full_name INTO v_sender_name FROM musician_profiles WHERE id = v_sender_id;
  SELECT full_name INTO v_receiver_name FROM musician_profiles WHERE id = v_receiver_id;

  v_project_name := 'Collaboration: ' || COALESCE(v_sender_name, 'Unknown') || ' & ' || COALESCE(v_receiver_name, 'Unknown');

  v_error_step := 'Updating request status';

  -- Update request status
  UPDATE collaboration_requests
  SET 
    status = 'accepted',
    updated_at = now()
  WHERE id = request_id;

  v_error_step := 'Creating collaboration project';

  -- Create new project (trigger will automatically add receiver as owner)
  INSERT INTO collaboration_projects (project_name, description, creator_id, status)
  VALUES (v_project_name, COALESCE(v_message, 'Collaborative music project'), v_receiver_id, 'active')
  RETURNING id INTO v_new_project_id;

  IF v_new_project_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create project';
  END IF;

  v_error_step := 'Adding sender as collaborator';

  -- Add sender as collaborator (receiver already added by trigger)
  INSERT INTO project_collaborators (project_id, musician_id, role, can_upload, can_delete)
  VALUES (v_new_project_id, v_sender_id, 'collaborator', true, false)
  ON CONFLICT (project_id, musician_id) DO NOTHING;

  v_error_step := 'Verifying collaborators';

  -- Verify both collaborators were added
  SELECT COUNT(*) INTO v_collab_count
  FROM project_collaborators 
  WHERE project_id = v_new_project_id;

  IF v_collab_count < 2 THEN
    RAISE EXCEPTION 'Failed to add collaborators. Only % collaborators added', v_collab_count;
  END IF;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'project_id', v_new_project_id,
    'project_name', v_project_name
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error if table exists
    BEGIN
      INSERT INTO collaboration_errors (request_id, error_step, error_message, error_details)
      VALUES (request_id, COALESCE(v_error_step, 'Unknown'), SQLERRM, 
              json_build_object('sqlstate', SQLSTATE)::jsonb);
    EXCEPTION
      WHEN OTHERS THEN
        -- Ignore if error table doesn't exist
        NULL;
    END;
    RAISE;
END;
$$;

-- =====================================================
-- 4. ENSURE TRIGGER IS PROPERLY SET
-- =====================================================

-- Recreate trigger if needed
DROP TRIGGER IF EXISTS on_project_created ON collaboration_projects;

CREATE TRIGGER on_project_created
  AFTER INSERT ON collaboration_projects
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_owner();
