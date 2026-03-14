/*
  # Clean up duplicate collaboration projects (safe version)

  1. Changes
    - Deletes related records first (files, comments, chat, activity logs, collaborators)
    - Then deletes duplicate projects keeping only the most recent one per collaboration pair
    - Ensures each collaboration has only one active project

  2. Notes
    - This is a one-time cleanup migration
    - Handles foreign key constraints by deleting in correct order
*/

-- First, identify projects to delete (duplicates and incomplete projects)
CREATE TEMP TABLE projects_to_delete AS
WITH ranked_projects AS (
  SELECT 
    cp.id,
    cp.creator_id,
    cp.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY 
        LEAST(cp.creator_id, COALESCE((
          SELECT pc.musician_id 
          FROM project_collaborators pc 
          WHERE pc.project_id = cp.id 
          AND pc.musician_id != cp.creator_id 
          LIMIT 1
        ), cp.creator_id)),
        GREATEST(cp.creator_id, COALESCE((
          SELECT pc.musician_id 
          FROM project_collaborators pc 
          WHERE pc.project_id = cp.id 
          AND pc.musician_id != cp.creator_id 
          LIMIT 1
        ), cp.creator_id))
      ORDER BY cp.created_at DESC
    ) as rn,
    (
      SELECT COUNT(*) 
      FROM project_collaborators pc 
      WHERE pc.project_id = cp.id
    ) as collab_count
  FROM collaboration_projects cp
  WHERE cp.status = 'active'
)
SELECT id FROM ranked_projects WHERE rn > 1 OR collab_count < 2;

-- Delete related records in order (to avoid foreign key violations)
DELETE FROM project_chat_messages WHERE project_id IN (SELECT id FROM projects_to_delete);
DELETE FROM project_comments WHERE project_id IN (SELECT id FROM projects_to_delete);
DELETE FROM project_activity_log WHERE project_id IN (SELECT id FROM projects_to_delete);
DELETE FROM project_files WHERE project_id IN (SELECT id FROM projects_to_delete);
DELETE FROM project_collaborators WHERE project_id IN (SELECT id FROM projects_to_delete);

-- Finally delete the projects
DELETE FROM collaboration_projects WHERE id IN (SELECT id FROM projects_to_delete);

-- Clean up temp table
DROP TABLE projects_to_delete;
