/*
  # Add comprehensive error logging to collaboration acceptance

  1. Changes
    - Replace accept_collaboration_request function with detailed error logging
    - Add step-by-step validation and error messages
    - Remove pg_sleep (not needed in synchronous function)
    - Add better duplicate prevention
    - Log errors to a dedicated table for debugging

  2. New Table
    - collaboration_errors: Tracks all errors during acceptance for debugging
*/

-- Create error logging table
CREATE TABLE IF NOT EXISTS collaboration_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid,
  error_step text,
  error_message text,
  error_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collaboration_errors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can log errors" ON collaboration_errors;
DROP POLICY IF EXISTS "Users can read errors" ON collaboration_errors;

-- Allow authenticated users to insert errors
CREATE POLICY "Anyone can log errors"
  ON collaboration_errors FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to read their own errors
CREATE POLICY "Users can read errors"
  ON collaboration_errors FOR SELECT
  TO authenticated
  USING (true);

-- Create improved accept_collaboration_request function with detailed logging
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
  v_existing_project_id uuid;
  v_collab_count int;
  v_result json;
  v_error_step text;
BEGIN
  v_error_step := 'Getting caller musician ID';
  
  -- Get the musician_id of the caller
  SELECT id INTO v_caller_musician_id
  FROM musician_profiles
  WHERE user_id = auth.uid();

  IF v_caller_musician_id IS NULL THEN
    INSERT INTO collaboration_errors (request_id, error_step, error_message)
    VALUES (request_id, v_error_step, 'User is not a musician');
    RAISE EXCEPTION 'User is not a musician';
  END IF;

  v_error_step := 'Fetching and locking request';

  -- Get request details and lock the row for update to prevent race conditions
  SELECT sender_id, receiver_id, message
  INTO v_sender_id, v_receiver_id, v_message
  FROM collaboration_requests
  WHERE id = request_id
  AND status = 'pending'
  FOR UPDATE;

  IF v_receiver_id IS NULL THEN
    INSERT INTO collaboration_errors (request_id, error_step, error_message)
    VALUES (request_id, v_error_step, 'Request not found or already processed');
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  v_error_step := 'Verifying caller is receiver';

  -- Verify caller is the receiver
  IF v_caller_musician_id != v_receiver_id THEN
    INSERT INTO collaboration_errors (request_id, error_step, error_message, error_details)
    VALUES (request_id, v_error_step, 'Only the receiver can accept', 
            json_build_object('caller_id', v_caller_musician_id, 'receiver_id', v_receiver_id)::jsonb);
    RAISE EXCEPTION 'Only the receiver can accept this request';
  END IF;

  v_error_step := 'Checking for existing project';

  -- Check if a project already exists for this exact collaboration pair
  SELECT cp.id INTO v_existing_project_id
  FROM collaboration_projects cp
  WHERE cp.creator_id = v_receiver_id
  AND EXISTS (
    SELECT 1 FROM project_collaborators pc
    WHERE pc.project_id = cp.id
    AND pc.musician_id = v_sender_id
  )
  AND cp.created_at >= (SELECT created_at FROM collaboration_requests WHERE id = request_id)
  ORDER BY cp.created_at DESC
  LIMIT 1;

  IF v_existing_project_id IS NOT NULL THEN
    INSERT INTO collaboration_errors (request_id, error_step, error_message, error_details)
    VALUES (request_id, v_error_step, 'Project already exists', 
            json_build_object('existing_project_id', v_existing_project_id)::jsonb);
    RAISE EXCEPTION 'Project already exists for this collaboration';
  END IF;

  v_error_step := 'Getting musician names';

  -- Get names for project title
  SELECT full_name INTO v_sender_name
  FROM musician_profiles
  WHERE id = v_sender_id;

  SELECT full_name INTO v_receiver_name
  FROM musician_profiles
  WHERE id = v_receiver_id;

  v_project_name := 'Collaboration: ' || COALESCE(v_sender_name, 'Unknown') || ' & ' || COALESCE(v_receiver_name, 'Unknown');

  v_error_step := 'Updating request status';

  -- Update request status first
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
    INSERT INTO collaboration_errors (request_id, error_step, error_message)
    VALUES (request_id, v_error_step, 'Failed to create project - no ID returned');
    RAISE EXCEPTION 'Failed to create project';
  END IF;

  v_error_step := 'Adding sender as collaborator';

  -- Add sender as collaborator (receiver already added by trigger)
  INSERT INTO project_collaborators (project_id, musician_id, role, can_upload, can_delete)
  VALUES (v_new_project_id, v_sender_id, 'collaborator', true, false);

  v_error_step := 'Verifying collaborators';

  -- Verify both collaborators were added
  SELECT COUNT(*) INTO v_collab_count
  FROM project_collaborators 
  WHERE project_id = v_new_project_id;

  IF v_collab_count < 2 THEN
    INSERT INTO collaboration_errors (request_id, error_step, error_message, error_details)
    VALUES (request_id, v_error_step, 'Failed to add both collaborators', 
            json_build_object('collab_count', v_collab_count, 'project_id', v_new_project_id)::jsonb);
    RAISE EXCEPTION 'Failed to add collaborators to project. Only % collaborators added', v_collab_count;
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
    -- Log the error with full context
    INSERT INTO collaboration_errors (request_id, error_step, error_message, error_details)
    VALUES (request_id, COALESCE(v_error_step, 'Unknown'), SQLERRM, 
            json_build_object('sqlstate', SQLSTATE)::jsonb);
    -- Re-raise the exception to roll back the transaction
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_collaboration_request(uuid) TO authenticated;
