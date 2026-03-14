/*
  # Fix duplicate insert in accept_collaboration_request function

  1. Changes
    - Removes manual insert of receiver as owner since the trigger `on_project_created` already does this
    - The trigger `add_creator_as_owner()` automatically adds the creator as owner when a project is created
    - Only need to manually add the sender as a collaborator

  2. Notes
    - This fixes the duplicate key violation error that prevents collaboration acceptance
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
  v_result json;
BEGIN
  -- Get the musician_id of the caller
  SELECT id INTO v_caller_musician_id
  FROM musician_profiles
  WHERE user_id = auth.uid();

  IF v_caller_musician_id IS NULL THEN
    RAISE EXCEPTION 'User is not a musician';
  END IF;

  -- Get request details
  SELECT sender_id, receiver_id, message
  INTO v_sender_id, v_receiver_id, v_message
  FROM collaboration_requests
  WHERE id = request_id
  AND status = 'pending';

  IF v_receiver_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Verify caller is the receiver
  IF v_caller_musician_id != v_receiver_id THEN
    RAISE EXCEPTION 'Only the receiver can accept this request';
  END IF;

  -- Get names for project title
  SELECT full_name INTO v_sender_name
  FROM musician_profiles
  WHERE id = v_sender_id;

  SELECT full_name INTO v_receiver_name
  FROM musician_profiles
  WHERE id = v_receiver_id;

  v_project_name := 'Collaboration: ' || COALESCE(v_sender_name, 'Unknown') || ' & ' || COALESCE(v_receiver_name, 'Unknown');

  -- Update request status
  UPDATE collaboration_requests
  SET 
    status = 'accepted',
    updated_at = now()
  WHERE id = request_id;

  -- Create new project (trigger will automatically add receiver as owner)
  INSERT INTO collaboration_projects (project_name, description, creator_id, status)
  VALUES (v_project_name, COALESCE(v_message, 'Collaborative music project'), v_receiver_id, 'active')
  RETURNING id INTO v_new_project_id;

  -- Add sender as collaborator (receiver already added by trigger)
  INSERT INTO project_collaborators (project_id, musician_id, role, can_upload, can_delete)
  VALUES (v_new_project_id, v_sender_id, 'collaborator', true, false);

  -- Return project details
  SELECT json_build_object(
    'success', true,
    'project_id', v_new_project_id,
    'project_name', v_project_name
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_collaboration_request(uuid) TO authenticated;
