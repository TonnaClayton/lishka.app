-- Create storage buckets for gear images and avatars
-- This will fix the "Bucket not found" error

-- Create gear-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gear-images',
  'gear-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

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

-- Verify buckets were created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('gear-images', 'avatars');