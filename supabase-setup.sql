-- IMPORTANT: Run this script in your Supabase SQL Editor to add the gear_items column
-- This will fix the "Could not find the 'gear_items' column" error

-- Add gear_items column to profiles table
-- This column will store an array of gear items as JSONB
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gear_items JSONB DEFAULT '[]'::jsonb;

-- Add an index on gear_items for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_gear_items 
ON profiles USING GIN (gear_items);

-- Update RLS policies to allow users to read/write their own gear_items
-- (This assumes you already have RLS policies for the profiles table)

-- Example RLS policies (adjust based on your existing setup):
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view own profile" ON profiles
--   FOR SELECT USING (auth.uid() = id);

-- CREATE POLICY "Users can update own profile" ON profiles
--   FOR UPDATE USING (auth.uid() = id);

-- CREATE POLICY "Users can insert own profile" ON profiles
--   FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'gear_items';

-- AFTER RUNNING THIS SCRIPT:
-- 1. Go to your terminal and run: npm run types:supabase
-- 2. This will regenerate the TypeScript types to include the new gear_items column
-- 3. Then try uploading gear again - it should work!
