-- Add current_streak column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_study_date DATE;

-- Create function to calculate and update streak
CREATE OR REPLACE FUNCTION update_user_streak(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    last_date DATE;
    current_streak_val INTEGER;
    today_date DATE := CURRENT_DATE;
    yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
    -- Get user's last study date and current streak
    SELECT last_study_date, current_streak 
    INTO last_date, current_streak_val
    FROM public.profiles 
    WHERE id = user_id;
    
    -- If no previous study date, start streak at 1
    IF last_date IS NULL THEN
        current_streak_val := 1;
    -- If studied yesterday, increment streak
    ELSIF last_date = yesterday_date THEN
        current_streak_val := COALESCE(current_streak_val, 0) + 1;
    -- If studied today already, keep current streak
    ELSIF last_date = today_date THEN
        current_streak_val := COALESCE(current_streak_val, 1);
    -- If gap in study days, reset streak to 1
    ELSE
        current_streak_val := 1;
    END IF;
    
    -- Update profile with new streak and study date
    UPDATE public.profiles 
    SET current_streak = current_streak_val,
        last_study_date = today_date
    WHERE id = user_id;
    
    RETURN current_streak_val;
END;
$$ LANGUAGE plpgsql;

-- Create function to prevent multiple active sessions
CREATE OR REPLACE FUNCTION check_active_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- If trying to create an active session, check for existing active sessions
    IF NEW.is_active = true THEN
        -- End any existing active sessions for this user
        UPDATE public.study_sessions 
        SET is_active = false, 
            end_time = NOW(),
            duration_minutes = EXTRACT(EPOCH FROM (NOW() - start_time)) / 60
        WHERE user_id = NEW.user_id 
        AND is_active = true 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent multiple active sessions
DROP TRIGGER IF EXISTS prevent_multiple_sessions ON public.study_sessions;
CREATE TRIGGER prevent_multiple_sessions
    BEFORE INSERT OR UPDATE ON public.study_sessions
    FOR EACH ROW
    EXECUTE FUNCTION check_active_sessions();
