/*
  # Collaborative Projects & File Sharing System

  ## Overview
  This migration creates a complete collaboration system for musicians to work together on projects,
  share files, and bounce audio files back and forth.

  ## New Tables

  ### 1. `collaboration_projects`
  - `id` (uuid, primary key) - Unique project identifier
  - `project_name` (text) - Name of the collaborative project
  - `description` (text) - Project description and goals
  - `creator_id` (uuid) - References musician_profiles (project creator)
  - `status` (text) - Project status: 'active', 'completed', 'archived'
  - `genre` (text) - Music genre for the project
  - `deadline` (date) - Optional project deadline
  - `created_at` (timestamptz) - Project creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `project_collaborators`
  - `id` (uuid, primary key) - Unique collaborator entry
  - `project_id` (uuid) - References collaboration_projects
  - `musician_id` (uuid) - References musician_profiles
  - `role` (text) - Role in project: 'owner', 'collaborator'
  - `can_upload` (boolean) - Permission to upload files
  - `can_delete` (boolean) - Permission to delete files
  - `joined_at` (timestamptz) - When they joined the project

  ### 3. `project_files`
  - `id` (uuid, primary key) - Unique file identifier
  - `project_id` (uuid) - References collaboration_projects
  - `file_name` (text) - Original file name
  - `file_path` (text) - Storage path in Supabase Storage
  - `file_type` (text) - MIME type
  - `file_size` (bigint) - File size in bytes
  - `uploaded_by` (uuid) - References musician_profiles
  - `version_number` (integer) - Version tracking for bounced files
  - `parent_file_id` (uuid) - References project_files (for version history)
  - `notes` (text) - Optional notes about the file/version
  - `is_latest_version` (boolean) - Flag for current version
  - `created_at` (timestamptz) - Upload timestamp

  ### 4. `project_comments`
  - `id` (uuid, primary key) - Unique comment identifier
  - `project_id` (uuid) - References collaboration_projects
  - `file_id` (uuid) - Optional: References project_files (for file-specific comments)
  - `musician_id` (uuid) - References musician_profiles
  - `comment_text` (text) - Comment content
  - `created_at` (timestamptz) - Comment timestamp

  ### 5. `project_activity_log`
  - `id` (uuid, primary key) - Unique activity identifier
  - `project_id` (uuid) - References collaboration_projects
  - `musician_id` (uuid) - References musician_profiles
  - `activity_type` (text) - Type: 'file_uploaded', 'file_deleted', 'comment_added', etc.
  - `activity_data` (jsonb) - Additional activity details
  - `created_at` (timestamptz) - Activity timestamp

  ## Security
  - Enable RLS on all tables
  - Policies ensure only project collaborators can access project data
  - File upload/delete permissions enforced at database level

  ## Important Notes
  1. Files are stored in Supabase Storage bucket 'project-files'
  2. Version tracking allows musicians to bounce files back and forth
  3. Activity log provides complete project history
  4. Comments can be attached to entire project or specific files
*/

-- Create collaboration_projects table
CREATE TABLE IF NOT EXISTS collaboration_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  description text DEFAULT '',
  creator_id uuid NOT NULL REFERENCES musician_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  genre text DEFAULT '',
  deadline date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES collaboration_projects(id) ON DELETE CASCADE,
  musician_id uuid NOT NULL REFERENCES musician_profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator')),
  can_upload boolean DEFAULT true,
  can_delete boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(project_id, musician_id)
);

-- Create project_files table
CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES collaboration_projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  uploaded_by uuid NOT NULL REFERENCES musician_profiles(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  parent_file_id uuid REFERENCES project_files(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  is_latest_version boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create project_comments table
CREATE TABLE IF NOT EXISTS project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES collaboration_projects(id) ON DELETE CASCADE,
  file_id uuid REFERENCES project_files(id) ON DELETE CASCADE,
  musician_id uuid NOT NULL REFERENCES musician_profiles(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create project_activity_log table
CREATE TABLE IF NOT EXISTS project_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES collaboration_projects(id) ON DELETE CASCADE,
  musician_id uuid NOT NULL REFERENCES musician_profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_collaboration_projects_creator ON collaboration_projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_projects_status ON collaboration_projects(status);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_musician ON project_collaborators(musician_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_version ON project_files(parent_file_id, version_number);
CREATE INDEX IF NOT EXISTS idx_project_comments_project ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_file ON project_comments(file_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_project ON project_activity_log(project_id);

-- Enable Row Level Security
ALTER TABLE collaboration_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collaboration_projects

CREATE POLICY "Collaborators can view projects"
  ON collaboration_projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_collaborators.project_id = collaboration_projects.id
      AND project_collaborators.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Musicians can create projects"
  ON collaboration_projects FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id IN (
      SELECT id FROM musician_profiles WHERE user_id = auth.uid()
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
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
      AND project_collaborators.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_collaborators.project_id = collaboration_projects.id
      AND project_collaborators.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
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
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
      AND project_collaborators.role = 'owner'
    )
  );

-- RLS Policies for project_collaborators

CREATE POLICY "Collaborators can view project members"
  ON project_collaborators FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
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
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
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
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
      AND pc.role = 'owner'
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT pc.project_id FROM project_collaborators pc
      WHERE pc.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
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
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
      AND pc.role = 'owner'
    )
  );

-- RLS Policies for project_files

CREATE POLICY "Collaborators can view project files"
  ON project_files FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Collaborators with upload permission can add files"
  ON project_files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by IN (
      SELECT id FROM musician_profiles WHERE user_id = auth.uid()
    )
    AND project_id IN (
      SELECT pc.project_id FROM project_collaborators pc
      WHERE pc.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
      AND pc.can_upload = true
    )
  );

CREATE POLICY "File uploaders and owners can update files"
  ON project_files FOR UPDATE
  TO authenticated
  USING (
    uploaded_by IN (
      SELECT id FROM musician_profiles WHERE user_id = auth.uid()
    )
    OR project_id IN (
      SELECT pc.project_id FROM project_collaborators pc
      WHERE pc.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
      AND pc.role = 'owner'
    )
  )
  WITH CHECK (
    uploaded_by IN (
      SELECT id FROM musician_profiles WHERE user_id = auth.uid()
    )
    OR project_id IN (
      SELECT pc.project_id FROM project_collaborators pc
      WHERE pc.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
      AND pc.role = 'owner'
    )
  );

CREATE POLICY "Collaborators with delete permission can remove files"
  ON project_files FOR DELETE
  TO authenticated
  USING (
    uploaded_by IN (
      SELECT id FROM musician_profiles WHERE user_id = auth.uid()
    )
    OR project_id IN (
      SELECT pc.project_id FROM project_collaborators pc
      WHERE pc.musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
      AND pc.can_delete = true
    )
  );

-- RLS Policies for project_comments

CREATE POLICY "Collaborators can view comments"
  ON project_comments FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Collaborators can add comments"
  ON project_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = auth.uid()
    )
    AND project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Comment authors can update their comments"
  ON project_comments FOR UPDATE
  TO authenticated
  USING (
    musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Comment authors can delete their comments"
  ON project_comments FOR DELETE
  TO authenticated
  USING (
    musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for project_activity_log

CREATE POLICY "Collaborators can view activity log"
  ON project_activity_log FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Collaborators can add activity log entries"
  ON project_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    musician_id IN (
      SELECT id FROM musician_profiles WHERE user_id = auth.uid()
    )
    AND project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE musician_id IN (
        SELECT id FROM musician_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Function to automatically add creator as owner when project is created
CREATE OR REPLACE FUNCTION add_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_collaborators (project_id, musician_id, role, can_upload, can_delete)
  VALUES (NEW.id, NEW.creator_id, 'owner', true, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add creator as owner
DROP TRIGGER IF EXISTS on_project_created ON collaboration_projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON collaboration_projects
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_owner();

-- Function to mark old versions as not latest when new version is uploaded
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update file versions
DROP TRIGGER IF EXISTS on_new_version_uploaded ON project_files;
CREATE TRIGGER on_new_version_uploaded
  AFTER INSERT ON project_files
  FOR EACH ROW
  EXECUTE FUNCTION update_file_versions();

-- Function to log project activity
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to log activity
DROP TRIGGER IF EXISTS log_file_activity ON project_files;
CREATE TRIGGER log_file_activity
  AFTER INSERT OR DELETE ON project_files
  FOR EACH ROW
  EXECUTE FUNCTION log_project_activity();

DROP TRIGGER IF EXISTS log_comment_activity ON project_comments;
CREATE TRIGGER log_comment_activity
  AFTER INSERT ON project_comments
  FOR EACH ROW
  EXECUTE FUNCTION log_project_activity();