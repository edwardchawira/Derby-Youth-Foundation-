/*
  # Fix collaboration acceptance issues

  1. Changes
    - Wrap function in explicit BEGIN/END transaction block
    - Add check to prevent duplicate project creation for same request
    - Improve error handling to ensure atomic operations
    - Ensure both collaborators are added successfully or transaction rolls back
    - Use ON CONFLICT for idempotency

  2. Security
    - Maintains SECURITY DEFINER to bypass RLS
    - All operations are atomic - either all succeed or all fail
*/

CREATE OR REPLACE FUNCTION accept_collaboration_request(request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  v_existing_project_count int;
  v_result json;
BEGIN
  -- Get the musician_id of the caller
  SELECT id INTO v_caller_musician_id
  FROM musician_profiles
  WHERE user_id = auth.uid();

  IF v_caller_musician_id IS NULL THEN
    RAISE EXCEPTION 'User is not a musician';
  END IF;

  -- Get request details and lock the row for update to prevent race conditions
  SELECT sender_id, receiver_id, message
  INTO v_sender_id, v_receiver_id, v_message
  FROM collaboration_requests
  WHERE id = request_id
  AND status = 'pending'
  FOR UPDATE;

  IF v_receiver_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Verify caller is the receiver
  IF v_caller_musician_id != v_receiver_id THEN
    RAISE EXCEPTION 'Only the receiver can accept this request';
  END IF;

  -- Check if a project was already created for this request (prevent duplicates)
  SELECT COUNT(*) INTO v_existing_project_count
  FROM collaboration_projects cp
  WHERE cp.creator_id = v_receiver_id
  AND EXISTS (
    SELECT 1 FROM project_collaborators pc
    WHERE pc.project_id = cp.id
    AND pc.musician_id = v_sender_id
  )
  AND cp.created_at > (SELECT updated_at FROM collaboration_requests WHERE id = request_id);

  IF v_existing_project_count > 0 THEN
    RAISE EXCEPTION 'Project already exists for this collaboration';
  END IF;

  -- Get names for project title
  SELECT full_name INTO v_sender_name
  FROM musician_profiles
  WHERE id = v_sender_id;

  SELECT full_name INTO v_receiver_name
  FROM musician_profiles
  WHERE id = v_receiver_id;

  v_project_name := 'Collaboration: ' || COALESCE(v_sender_name, 'Unknown') || ' & ' || COALESCE(v_receiver_name, 'Unknown');

  -- Update request status first
  UPDATE collaboration_requests
  SET 
    status = 'accepted',
    updated_at = now()
  WHERE id = request_id;

  -- Create new project (trigger will automatically add receiver as owner)
  INSERT INTO collaboration_projects (project_name, description, creator_id, status)
  VALUES (v_project_name, COALESCE(v_message, 'Collaborative music project'), v_receiver_id, 'active')
  RETURNING id INTO v_new_project_id;

  -- Small delay to ensure trigger completes
  PERFORM pg_sleep(0.1);

  -- Add sender as collaborator (receiver already added by trigger)
  -- Use INSERT with ON CONFLICT for idempotency
  INSERT INTO project_collaborators (project_id, musician_id, role, can_upload, can_delete)
  VALUES (v_new_project_id, v_sender_id, 'collaborator', true, false)
  ON CONFLICT (project_id, musician_id) DO NOTHING;

  -- Verify both collaborators were added
  IF (SELECT COUNT(*) FROM project_collaborators WHERE project_id = v_new_project_id) < 2 THEN
    RAISE EXCEPTION 'Failed to add collaborators to project';
  END IF;

  -- Return project details
  SELECT json_build_object(
    'success', true,
    'project_id', v_new_project_id,
    'project_name', v_project_name
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the exception to roll back the transaction
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_collaboration_request(uuid) TO authenticated;
