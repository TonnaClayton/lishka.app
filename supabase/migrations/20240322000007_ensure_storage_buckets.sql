-- Ensure storage buckets exist and are properly configured
-- This migration ensures the gear-images and avatars buckets are created
-- and handles any potential conflicts or missing configurations

-- Create gear-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gear-images',
  'gear-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create fish-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fish-photos',
  'fish-photos',
  true, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload gear images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for gear images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their gear images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their gear images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload fish photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for fish photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their fish photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their fish photos" ON storage.objects;

-- Set up RLS policies for gear-images bucket
-- Allow authenticated users to upload their own gear images
CREATE POLICY "Authenticated users can upload gear images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gear-images' AND 
    auth.role() = 'authenticated'
  );

-- Allow public read access to gear images
CREATE POLICY "Public read access for gear images" ON storage.objects
  FOR SELECT USING (bucket_id = 'gear-images');

-- Allow users to update their own gear images
CREATE POLICY "Users can update their gear images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'gear-images' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own gear images
CREATE POLICY "Users can delete their gear images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'gear-images' AND 
    auth.role() = 'authenticated'
  );

-- Set up RLS policies for avatars bucket
-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated'
  );

-- Allow public read access to avatars
CREATE POLICY "Public read access for avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated'
  );

-- Set up RLS policies for fish-photos bucket
-- Allow authenticated users to upload fish photos
CREATE POLICY "Authenticated users can upload fish photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fish-photos' AND 
    auth.role() = 'authenticated'
  );

-- Allow public read access to fish photos
CREATE POLICY "Public read access for fish photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fish-photos');

-- Allow users to update their own fish photos
CREATE POLICY "Users can update their fish photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'fish-photos' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own fish photos
CREATE POLICY "Users can delete their fish photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'fish-photos' AND 
    auth.role() = 'authenticated'
  );

-- Verify buckets were created and configured properly
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id IN ('gear-images', 'avatars', 'fish-photos')
ORDER BY id;

-- Also verify that the profiles table has the gear_items column
-- This will help identify if there are any schema issues
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name IN ('gear_items', 'gallery_photos')
ORDER BY column_name;
