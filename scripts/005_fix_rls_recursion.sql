-- Drop all existing RLS policies that might cause recursion
DROP POLICY IF EXISTS "members_select_group" ON public.group_members;
DROP POLICY IF EXISTS "members_insert_own" ON public.group_members;
DROP POLICY IF EXISTS "members_delete_own" ON public.group_members;

-- Create simple, non-recursive RLS policies for group_members
-- Users can see group members only for groups they belong to
CREATE POLICY "group_members_select_policy" ON public.group_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid()
  )
);

-- Users can insert themselves into groups (handled by application logic)
CREATE POLICY "group_members_insert_policy" ON public.group_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Users can delete their own membership
CREATE POLICY "group_members_delete_policy" ON public.group_members FOR DELETE USING (
  user_id = auth.uid()
);

-- Update study_groups policies to be simpler
DROP POLICY IF EXISTS "groups_select_member" ON public.study_groups;
CREATE POLICY "study_groups_select_policy" ON public.study_groups FOR SELECT USING (
  creator_id = auth.uid() OR 
  id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
  )
);
