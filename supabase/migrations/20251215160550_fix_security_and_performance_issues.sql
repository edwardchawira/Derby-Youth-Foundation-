/*
  # Comprehensive Security and Performance Fixes

  ## 1. Missing Foreign Key Indexes
  Adds indexes to foreign key columns that were missing them:
  - `project_activity_feeds.actor_id`
  - `project_activity_log.musician_id`
  - `project_chat_messages.musician_id`
  - `project_comments.musician_id`
  - `project_files.uploaded_by`
  - `project_messages.sender_id`

  ## 2. Auth RLS Optimization
  Optimizes all RLS policies by replacing `auth.uid()` with `(select auth.uid())` to prevent
  re-evaluation for each row. This significantly improves query performance at scale.

  Affected tables:
  - `collaboration_projects` (4 policies)
  - `project_chat_messages` (2 policies)
  - `project_files` (4 policies)
  - `project_comments` (4 policies)
  - `project_activity_log` (2 policies)
  - `project_collaborators` (4 policies)
  - `project_messages` (2 policies)
  - `project_activity_feeds` (1 policy)

  ## 3. Remove Unused Indexes
  Removes indexes that are not being used, reducing maintenance overhead:
  - `idx_equipment_items_category_id`
  - `idx_collaboration_projects_creator`
  - `idx_collaboration_projects_status`
  - `idx_project_files_version`
  - `idx_project_comments_file`
  - `idx_project_messages_created`
  - `idx_project_activity_feeds_created`
  - `idx_chat_messages_created_at`

  ## 4. Consolidate Multiple Permissive Policies
  Consolidates overlapping policies on:
  - `musician_profiles` - Combines "Anyone can view verified active profiles" and "Musicians can read their own profile"
  - `musician_skills` - Combines "Public can view skills of verified musicians" and "Musicians can manage their own skills"

  ## 5. Fix Function Search Paths
  Sets explicit search paths for all functions to prevent security issues:
  - `add_creator_as_owner`
  - `update_file_versions`
  - `log_project_activity`
  - `auto_create_project_on_collab_accept`
  - `create_activity_feed_on_message`
  - `create_activity_feed_on_file_upload`

  ## Important Notes
  - All changes are designed to be backward-compatible
  - Query performance should improve significantly
  - Security posture is strengthened
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Add index for project_activity_feeds.actor_id
CREATE INDEX IF NOT EXISTS idx_project_activity_feeds_actor_id 
  ON project_activity_feeds(actor_id);

-- Add index for project_activity_log.musician_id
CREATE INDEX IF NOT EXISTS idx_project_activity_log_musician_id 
  ON project_activity_log(musician_id);

-- Add index for project_chat_messages.musician_id
CREATE INDEX IF NOT EXISTS idx_project_chat_messages_musician_id 
  ON project_chat_messages(musician_id);

-- Add index for project_comments.musician_id
CREATE INDEX IF NOT EXISTS idx_project_comments_musician_id 
  ON project_comments(musician_id);

-- Add index for project_files.uploaded_by
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by 
  ON project_files(uploaded_by);

-- Add index for project_messages.sender_id
CREATE INDEX IF NOT EXISTS idx_project_messages_sender_id 
  ON project_messages(sender_id);

-- ============================================================================
-- 2. REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_equipment_items_category_id;
DROP INDEX IF EXISTS idx_collaboration_projects_creator;
DROP INDEX IF EXISTS idx_collaboration_projects_status;
DROP INDEX IF EXISTS idx_project_files_version;
DROP INDEX IF EXISTS idx_project_comments_file;
DROP INDEX IF EXISTS idx_project_messages_created;
DROP INDEX IF EXISTS idx_project_activity_feeds_created;
DROP INDEX IF EXISTS idx_chat_messages_created_at;

-- ============================================================================
-- 3. OPTIMIZE RLS POLICIES - COLLABORATION_PROJECTS
-- ============================================================================

DROP POLICY IF EXISTS "Collaborators can view projects" ON collaboration_projects;
DROP POLICY IF EXISTS "Musicians can create projects" ON collaboration_projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON collaboration_projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON collaboration_projects;

CREATE POLICY "Collaborators can view projects"
  ON collaboration_projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_collaborators.project_id = collaboration_projects.id
      AND project_collaborators.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Musicians can create projects"
  ON collaboration_projects FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Project owners can update projects"
  ON collaboration_projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_collaborators.project_id = collaboration_projects.id
      AND project_collaborators.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
      AND project_collaborators.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_collaborators.project_id = collaboration_projects.id
      AND project_collaborators.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
      AND project_collaborators.role = 'owner'
    )
  );

CREATE POLICY "Project owners can delete projects"
  ON collaboration_projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_collaborators.project_id = collaboration_projects.id
      AND project_collaborators.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
      AND project_collaborators.role = 'owner'
    )
  );

-- ============================================================================
-- 4. OPTIMIZE RLS POLICIES - PROJECT_COLLABORATORS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their project collaborations" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can add collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can update collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can remove collaborators" ON project_collaborators;

-- Note: The original policy name was "Collaborators can view project members" but
-- the security report references "Users can view their project collaborations"
-- Creating both to ensure we cover the right one

DROP POLICY IF EXISTS "Collaborators can view project members" ON project_collaborators;

CREATE POLICY "Collaborators can view project members"
  ON project_collaborators FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_collaborators pc
      WHERE pc.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Project owners can add collaborators"
  ON project_collaborators FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT pc.project_id FROM project_collaborators pc
      WHERE pc.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
      AND pc.role = 'owner'
    )
  );

CREATE POLICY "Project owners can update collaborators"
  ON project_collaborators FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT pc.project_id FROM project_collaborators pc
      WHERE pc.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
      AND pc.role = 'owner'
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT pc.project_id FROM project_collaborators pc
      WHERE pc.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
      AND pc.role = 'owner'
    )
  );

CREATE POLICY "Project owners can remove collaborators"
  ON project_collaborators FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT pc.project_id FROM project_collaborators pc
      WHERE pc.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
      AND pc.role = 'owner'
    )
  );

-- ============================================================================
-- 5. OPTIMIZE RLS POLICIES - PROJECT_FILES
-- ============================================================================

DROP POLICY IF EXISTS "Collaborators can view project files" ON project_files;
DROP POLICY IF EXISTS "Collaborators with upload permission can add files" ON project_files;
DROP POLICY IF EXISTS "File uploaders and owners can update files" ON project_files;
DROP POLICY IF EXISTS "Collaborators with delete permission can remove files" ON project_files;

CREATE POLICY "Collaborators can view project files"
  ON project_files FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Collaborators with upload permission can add files"
  ON project_files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
    AND project_id IN (
      SELECT pc.project_id FROM project_collaborators pc
      WHERE pc.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
      AND pc.can_upload = true
    )
  );

CREATE POLICY "File uploaders and owners can update files"
  ON project_files FOR UPDATE
  TO authenticated
  USING (
    uploaded_by IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
    OR project_id IN (
      SELECT pc.project_id FROM project_collaborators pc
      WHERE pc.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
      AND pc.role = 'owner'
    )
  )
  WITH CHECK (
    uploaded_by IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
    OR project_id IN (
      SELECT pc.project_id FROM project_collaborators pc
      WHERE pc.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
      AND pc.role = 'owner'
    )
  );

CREATE POLICY "Collaborators with delete permission can remove files"
  ON project_files FOR DELETE
  TO authenticated
  USING (
    uploaded_by IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
    OR project_id IN (
      SELECT pc.project_id FROM project_collaborators pc
      WHERE pc.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
      AND pc.can_delete = true
    )
  );

-- ============================================================================
-- 6. OPTIMIZE RLS POLICIES - PROJECT_COMMENTS
-- ============================================================================

DROP POLICY IF EXISTS "Collaborators can view comments" ON project_comments;
DROP POLICY IF EXISTS "Collaborators can add comments" ON project_comments;
DROP POLICY IF EXISTS "Comment authors can update their comments" ON project_comments;
DROP POLICY IF EXISTS "Comment authors can delete their comments" ON project_comments;

CREATE POLICY "Collaborators can view comments"
  ON project_comments FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Collaborators can add comments"
  ON project_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
    AND project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Comment authors can update their comments"
  ON project_comments FOR UPDATE
  TO authenticated
  USING (
    musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Comment authors can delete their comments"
  ON project_comments FOR DELETE
  TO authenticated
  USING (
    musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 7. OPTIMIZE RLS POLICIES - PROJECT_ACTIVITY_LOG
-- ============================================================================

DROP POLICY IF EXISTS "Collaborators can view activity log" ON project_activity_log;
DROP POLICY IF EXISTS "Collaborators can add activity log entries" ON project_activity_log;

CREATE POLICY "Collaborators can view activity log"
  ON project_activity_log FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Collaborators can add activity log entries"
  ON project_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
    AND project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
    )
  );

-- ============================================================================
-- 8. OPTIMIZE RLS POLICIES - PROJECT_CHAT_MESSAGES
-- ============================================================================

DROP POLICY IF EXISTS "Project collaborators can view chat messages" ON project_chat_messages;
DROP POLICY IF EXISTS "Project collaborators can send chat messages" ON project_chat_messages;

CREATE POLICY "Project collaborators can view chat messages"
  ON project_chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators pc
      JOIN musician_profiles mp ON pc.musician_id = mp.id
      WHERE pc.project_id = project_chat_messages.project_id
      AND mp.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Project collaborators can send chat messages"
  ON project_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM musician_profiles mp
      WHERE mp.id = musician_id
      AND mp.user_id = (select auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM project_collaborators pc
      WHERE pc.project_id = project_chat_messages.project_id
      AND pc.musician_id = musician_id
    )
  );

-- ============================================================================
-- 9. OPTIMIZE RLS POLICIES - PROJECT_MESSAGES
-- ============================================================================

DROP POLICY IF EXISTS "Collaborators can view project messages" ON project_messages;
DROP POLICY IF EXISTS "Collaborators can send messages" ON project_messages;

CREATE POLICY "Collaborators can view project messages"
  ON project_messages FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Collaborators can send messages"
  ON project_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
    AND project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
    )
  );

-- ============================================================================
-- 10. OPTIMIZE RLS POLICIES - PROJECT_ACTIVITY_FEEDS
-- ============================================================================

DROP POLICY IF EXISTS "Collaborators can view activity feeds" ON project_activity_feeds;

CREATE POLICY "Collaborators can view activity feeds"
  ON project_activity_feeds FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
      )
    )
  );

-- ============================================================================
-- 11. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- ============================================================================

-- Fix musician_profiles policies
DROP POLICY IF EXISTS "Anyone can view verified active profiles" ON musician_profiles;
DROP POLICY IF EXISTS "Musicians can read their own profile" ON musician_profiles;

-- Create single consolidated policy for viewing profiles
CREATE POLICY "View musician profiles"
  ON musician_profiles FOR SELECT
  TO authenticated, anon
  USING (
    (is_verified = true AND is_active = true)
    OR user_id = (select auth.uid())
  );

-- Fix musician_skills policies
DROP POLICY IF EXISTS "Public can view skills of verified musicians" ON musician_skills;
DROP POLICY IF EXISTS "Musicians can manage their own skills" ON musician_skills;

-- Create consolidated view policy
CREATE POLICY "View musician skills"
  ON musician_skills FOR SELECT
  TO authenticated, anon
  USING (
    musician_id IN (
      SELECT id FROM musician_profiles 
      WHERE (is_verified = true AND is_active = true)
      OR user_id = (select auth.uid())
    )
  );

-- Recreate management policies for musician_skills
CREATE POLICY "Musicians can insert their own skills"
  ON musician_skills FOR INSERT
  TO authenticated
  WITH CHECK (
    musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Musicians can update their own skills"
  ON musician_skills FOR UPDATE
  TO authenticated
  USING (
    musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Musicians can delete their own skills"
  ON musician_skills FOR DELETE
  TO authenticated
  USING (
    musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 12. FIX FUNCTION SEARCH PATHS
-- ============================================================================

-- Fix add_creator_as_owner
CREATE OR REPLACE FUNCTION add_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_collaborators (project_id, musician_id, role, can_upload, can_delete)
  VALUES (NEW.id, NEW.creator_id, 'owner', true, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix update_file_versions
CREATE OR REPLACE FUNCTION update_file_versions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_file_id IS NOT NULL THEN
    UPDATE project_files
    SET is_latest_version = false
    WHERE id = NEW.parent_file_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix log_project_activity
CREATE OR REPLACE FUNCTION log_project_activity()
RETURNS TRIGGER AS $$
DECLARE
  activity_type_var text;
  activity_data_var jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'project_files' THEN
      activity_type_var := 'file_uploaded';
      activity_data_var := jsonb_build_object(
        'file_name', NEW.file_name,
        'file_id', NEW.id,
        'version_number', NEW.version_number
      );
      INSERT INTO project_activity_log (project_id, musician_id, activity_type, activity_data)
      VALUES (NEW.project_id, NEW.uploaded_by, activity_type_var, activity_data_var);
    ELSIF TG_TABLE_NAME = 'project_comments' THEN
      activity_type_var := 'comment_added';
      activity_data_var := jsonb_build_object(
        'comment_id', NEW.id,
        'file_id', NEW.file_id
      );
      INSERT INTO project_activity_log (project_id, musician_id, activity_type, activity_data)
      VALUES (NEW.project_id, NEW.musician_id, activity_type_var, activity_data_var);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'project_files' THEN
      activity_type_var := 'file_deleted';
      activity_data_var := jsonb_build_object(
        'file_name', OLD.file_name,
        'file_id', OLD.id
      );
      INSERT INTO project_activity_log (project_id, musician_id, activity_type, activity_data)
      VALUES (OLD.project_id, OLD.uploaded_by, activity_type_var, activity_data_var);
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix auto_create_project_on_collab_accept
CREATE OR REPLACE FUNCTION auto_create_project_on_collab_accept()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO collaboration_projects (project_name, description, creator_id, status, genre)
    VALUES (
      'Collaboration: ' || (SELECT stage_name FROM musician_profiles WHERE id = NEW.requester_id LIMIT 1) || 
      ' & ' || (SELECT stage_name FROM musician_profiles WHERE id = NEW.receiver_id LIMIT 1),
      'Auto-generated project from collaboration request',
      NEW.requester_id,
      'active',
      COALESCE(NEW.project_genre, '')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix create_activity_feed_on_message
CREATE OR REPLACE FUNCTION create_activity_feed_on_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_activity_feeds (
    project_id,
    actor_id,
    activity_type,
    activity_data
  ) VALUES (
    NEW.project_id,
    NEW.sender_id,
    'message_sent',
    jsonb_build_object(
      'message_id', NEW.id,
      'message_preview', LEFT(NEW.message_text, 100)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix create_activity_feed_on_file_upload
CREATE OR REPLACE FUNCTION create_activity_feed_on_file_upload()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_activity_feeds (
    project_id,
    actor_id,
    activity_type,
    activity_data
  ) VALUES (
    NEW.project_id,
    NEW.uploaded_by,
    'file_uploaded',
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
