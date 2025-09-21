-- Fix study_sessions table to include session_type field and match the original schema
ALTER TABLE study_sessions 
ADD COLUMN IF NOT EXISTS session_type TEXT CHECK (session_type IN ('real_time', 'manual')) DEFAULT 'real_time';

-- Update existing records to have a valid session_type
UPDATE study_sessions 
SET session_type = 'real_time' 
WHERE session_type IS NULL;

-- Make session_type NOT NULL after setting default values
ALTER TABLE study_sessions 
ALTER COLUMN session_type SET NOT NULL;

-- Add points_earned column if it doesn't exist
ALTER TABLE study_sessions 
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- Update the column name from duration to duration_minutes for consistency
ALTER TABLE study_sessions 
RENAME COLUMN duration TO duration_minutes;
