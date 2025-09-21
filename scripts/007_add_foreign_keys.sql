-- Add missing foreign key constraints to establish proper relationships

-- Add foreign key from study_groups.creator_id to profiles.id
ALTER TABLE public.study_groups 
ADD CONSTRAINT study_groups_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from group_members.user_id to profiles.id
ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from group_members.group_id to study_groups.id
ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.study_groups(id) ON DELETE CASCADE;

-- Add foreign key from study_sessions.user_id to profiles.id
ALTER TABLE public.study_sessions 
ADD CONSTRAINT study_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from study_sessions.group_id to study_groups.id
ALTER TABLE public.study_sessions 
ADD CONSTRAINT study_sessions_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.study_groups(id) ON DELETE SET NULL;

-- Add foreign key from user_achievements.user_id to profiles.id
ALTER TABLE public.user_achievements 
ADD CONSTRAINT user_achievements_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from user_achievements.achievement_id to achievements.id
ALTER TABLE public.user_achievements 
ADD CONSTRAINT user_achievements_achievement_id_fkey 
FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE;
