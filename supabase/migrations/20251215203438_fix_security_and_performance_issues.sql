/*
  # Fix Security and Performance Issues

  ## Changes Applied

  ### 1. Add Missing Indexes on Foreign Keys
  Foreign keys without indexes cause table scans during JOIN operations and cascade operations:
  - `collaboration_projects.creator_id` - Frequently joined with musician_profiles
  - `equipment_items.category_id` - Used for filtering by category
  - `project_comments.file_id` - Nullable FK, needs conditional index
  - `project_files.parent_file_id` - Used for version tracking queries

  ### 2. Optimize RLS Policies for Performance
  Replace `auth.uid()` with `(select auth.uid())` to prevent re-evaluation per row:
  - Updates policy on `collaboration_requests` table
  - Significantly improves query performance at scale

  ### 3. Remove Unused Indexes
  Unused indexes slow down INSERT/UPDATE/DELETE operations without providing query benefits:
  - Drop 6 unused indexes across various tables
  - Improves write performance and reduces storage overhead

  ### 4. Fix Security Definer View
  Change `collaboration_acceptance_status` from SECURITY DEFINER to SECURITY INVOKER:
  - Prevents privilege escalation risks
  - Uses caller's permissions for better security

  ## Performance Impact
  - Improved JOIN performance on foreign key columns
  - Faster RLS policy evaluation
  - Better write performance with fewer indexes to maintain
  - Reduced storage requirements

  ## Security Impact
  - Eliminates privilege escalation risk from SECURITY DEFINER view
  - Maintains all existing security policies
  - No changes to data access patterns
*/

-- =====================================================
-- 1. ADD MISSING INDEXES ON FOREIGN KEYS
-- =====================================================

-- Index for collaboration_projects.creator_id (FK to musician_profiles)
-- Used when: Finding all projects created by a musician, JOIN operations
CREATE INDEX IF NOT EXISTS idx_collaboration_projects_creator_id 
ON collaboration_projects(creator_id);

-- Index for equipment_items.category_id (FK to equipment_categories)
-- Used when: Filtering equipment by category, JOIN operations
CREATE INDEX IF NOT EXISTS idx_equipment_items_category_id 
ON equipment_items(category_id);

-- Index for project_comments.file_id (nullable FK to project_files)
-- Used when: Finding comments for a specific file
-- Partial index to exclude NULL values (comments not tied to files)
CREATE INDEX IF NOT EXISTS idx_project_comments_file_id 
ON project_comments(file_id) 
WHERE file_id IS NOT NULL;

-- Index for project_files.parent_file_id (nullable FK for version tracking)
-- Used when: Finding all versions of a file
-- Partial index to exclude NULL values (original files without parent)
CREATE INDEX IF NOT EXISTS idx_project_files_parent_file_id 
ON project_files(parent_file_id) 
WHERE parent_file_id IS NOT NULL;

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - PREVENT PER-ROW EVALUATION
-- =====================================================

-- Drop and recreate the policy with optimized auth.uid() call
-- Using (SELECT auth.uid()) prevents re-evaluation for each row
DROP POLICY IF EXISTS "Receivers can update collaboration requests" ON collaboration_requests;

CREATE POLICY "Receivers can update collaboration requests"
  ON collaboration_requests
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IN (
    SELECT user_id FROM musician_profiles WHERE id = receiver_id
  ))
  WITH CHECK ((SELECT auth.uid()) IN (
    SELECT user_id FROM musician_profiles WHERE id = receiver_id
  ));

-- =====================================================
-- 3. DROP UNUSED INDEXES
-- =====================================================

-- These indexes have never been used and slow down write operations
DROP INDEX IF EXISTS idx_project_messages_sender_id;
DROP INDEX IF EXISTS idx_project_activity_feeds_actor_id;
DROP INDEX IF EXISTS idx_project_activity_log_musician_id;
DROP INDEX IF EXISTS idx_project_chat_messages_musician_id;
DROP INDEX IF EXISTS idx_project_comments_musician_id;
DROP INDEX IF EXISTS idx_project_files_uploaded_by;

-- =====================================================
-- 4. FIX SECURITY DEFINER VIEW
-- =====================================================

-- Recreate the view with SECURITY INVOKER instead of SECURITY DEFINER
-- This ensures the view runs with caller's permissions, not creator's
DROP VIEW IF EXISTS collaboration_acceptance_status;

CREATE OR REPLACE VIEW collaboration_acceptance_status
WITH (security_invoker = true)
AS
SELECT 
  cr.id as request_id,
  cr.sender_id,
  cr.receiver_id,
  cr.status,
  cr.created_at as request_created_at,
  cr.updated_at as request_updated_at,
  cp.id as project_id,
  cp.project_name,
  cp.created_at as project_created_at,
  CASE 
    WHEN cr.status = 'accepted' AND cp.id IS NOT NULL THEN 'success'
    WHEN cr.status = 'accepted' AND cp.id IS NULL THEN 'project_missing'
    WHEN cr.status = 'pending' THEN 'pending'
    WHEN cr.status = 'declined' THEN 'declined'
    ELSE 'unknown'
  END as acceptance_status
FROM collaboration_requests cr
LEFT JOIN project_collaborators pc ON pc.musician_id = cr.receiver_id
LEFT JOIN collaboration_projects cp ON cp.id = pc.project_id 
  AND cp.created_at >= cr.updated_at 
  AND cp.created_at <= cr.updated_at + INTERVAL '1 minute';
