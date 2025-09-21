-- Create study_sessions table for individual study tracking
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES study_groups(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration INTEGER DEFAULT 0, -- in minutes
  points_earned INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats(
  user_id UUID,
  study_time_to_add INTEGER,
  points_to_add INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    total_study_time = total_study_time + study_time_to_add,
    total_points = total_points + points_to_add,
    level = GREATEST(1, (total_points + points_to_add) / 100 + 1),
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_group_id ON study_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_is_active ON study_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON study_sessions(start_time);

-- Enable RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_sessions
CREATE POLICY "Users can view their own study sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions" ON study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions" ON study_sessions
  FOR DELETE USING (auth.uid() = user_id);
