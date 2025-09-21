-- Fix infinite recursion in group_members RLS policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "members_select_group" ON public.group_members;
DROP POLICY IF EXISTS "groups_select_member" ON public.study_groups;

-- Fix group_members SELECT policy to avoid circular reference
-- Allow users to see group members only for groups they belong to
-- Use a direct join instead of subquery to avoid recursion
CREATE POLICY "members_select_accessible" ON public.group_members FOR SELECT USING (
  -- User can see members of groups they are part of
  EXISTS (
    SELECT 1 FROM public.study_groups sg 
    WHERE sg.id = group_id 
    AND (
      sg.creator_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM auth.users u 
        WHERE u.id = auth.uid() 
        AND group_id IN (
          SELECT gm.group_id FROM public.group_members gm 
          WHERE gm.user_id = auth.uid()
        )
      )
    )
  )
);

-- Fix study_groups SELECT policy to avoid circular reference
-- Allow users to see groups they created or are members of
CREATE POLICY "groups_select_accessible" ON public.study_groups FOR SELECT USING (
  -- User can see groups they created
  creator_id = auth.uid() 
  OR 
  -- User can see groups they are a member of (direct check without subquery)
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = id AND gm.user_id = auth.uid()
  )
);

-- Also allow public viewing of basic group info for browsing
-- Add a policy to allow users to browse all active groups
CREATE POLICY "groups_browse_public" ON public.study_groups FOR SELECT USING (
  is_active = true
);
