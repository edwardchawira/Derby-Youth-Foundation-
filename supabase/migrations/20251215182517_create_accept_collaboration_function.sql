/*
  # Create function to accept collaboration requests

  1. New Functions
    - `accept_collaboration_request(request_id uuid)` - Handles the entire collaboration acceptance flow
      - Updates the request status to 'accepted'
      - Creates a new collaboration project
      - Adds the receiver as the project owner
      - Adds the sender as a collaborator
      - Returns the new project details
    
  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Validates that the caller is the receiver of the request
    - All operations are atomic (transaction)
*/

-- Drop function if it exists
DROP FUNCTION IF EXISTS accept_collaboration_request(uuid);

-- Create function to accept collaboration requests
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

  -- Create new project
  INSERT INTO collaboration_projects (project_name, description, creator_id, status)
  VALUES (v_project_name, COALESCE(v_message, 'Collaborative music project'), v_receiver_id, 'active')
  RETURNING id INTO v_new_project_id;

  -- Add receiver as owner
  INSERT INTO project_collaborators (project_id, musician_id, role, can_upload, can_delete)
  VALUES (v_new_project_id, v_receiver_id, 'owner', true, true);

  -- Add sender as collaborator
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION accept_collaboration_request(uuid) TO authenticated;
