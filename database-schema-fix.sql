-- Fix for missing gear_items column in profiles table
-- Run this SQL in your Supabase SQL editor

-- Add gear_items column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gear_items JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN profiles.gear_items IS 'Array of fishing gear items with AI analysis data';

-- Create index for better performance when querying gear items
CREATE INDEX IF NOT EXISTS idx_profiles_gear_items ON profiles USING GIN (gear_items);

-- Update RLS policy to allow users to update their own gear_items
-- (This assumes you have RLS enabled and basic policies set up)
CREATE POLICY IF NOT EXISTS "Users can update own gear_items" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
