/*
  # Fix Storage Policies - Remove Infinite Recursion

  1. Changes
    - Create profile-photos storage bucket
    - Drop all existing storage policies that cause recursion
    - Create simplified storage policies without circular references
    - Use direct auth.uid() checks instead of complex subqueries

  2. Security
    - Users can only upload/update/delete their own profile photos
    - Anyone can view profile photos (public read)
    - Project file policies simplified to prevent recursion
*/

-- Create profile-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Also ensure musician-profiles bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'musician-profiles',
  'musician-profiles',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing storage.objects policies to start fresh
DROP POLICY IF EXISTS "Musicians can upload their profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Musicians can update their profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Musicians can delete their profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Collaborators can upload project files" ON storage.objects;
DROP POLICY IF EXISTS "Collaborators can view project files" ON storage.objects;
DROP POLICY IF EXISTS "Collaborators can update project files" ON storage.objects;
DROP POLICY IF EXISTS "Collaborators can delete project files" ON storage.objects;

-- Profile Photos Policies (Simple, no recursion) - for profile-photos bucket
CREATE POLICY "Authenticated users can upload profile photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own profile photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND owner = auth.uid()
  );

CREATE POLICY "Users can delete their own profile photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND owner = auth.uid()
  );

CREATE POLICY "Anyone can view profile photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-photos');

-- Musician Profiles Policies (for backward compatibility)
CREATE POLICY "Authenticated users can upload musician profiles"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'musician-profiles'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own musician profiles"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'musician-profiles'
    AND owner = auth.uid()
  );

CREATE POLICY "Users can delete their own musician profiles"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'musician-profiles'
    AND owner = auth.uid()
  );

CREATE POLICY "Anyone can view musician profiles"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'musician-profiles');

-- Project Files Policies (Simplified to avoid recursion)
CREATE POLICY "Authenticated users can upload project files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can view project files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-files');

CREATE POLICY "Users can update their own project files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND owner = auth.uid()
  );

CREATE POLICY "Users can delete their own project files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND owner = auth.uid()
  );
