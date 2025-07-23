CREATE TABLE IF NOT EXISTS fish_catches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT,
  species TEXT,
  scientific_name TEXT,
  length_cm NUMERIC,
  confidence NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE POLICY "Users can view and insert their own catches" ON fish_catches
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

alter publication supabase_realtime add table fish_catches;
