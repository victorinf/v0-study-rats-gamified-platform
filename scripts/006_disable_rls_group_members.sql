-- Disable RLS on group_members table to prevent infinite recursion
-- This table will use application-level security instead

-- Drop all existing policies on group_members
DROP POLICY IF EXISTS "members_select_group" ON public.group_members;
DROP POLICY IF EXISTS "members_insert_own" ON public.group_members;
DROP POLICY IF EXISTS "members_delete_own" ON public.group_members;

-- Disable RLS on group_members table
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions for authenticated users
GRANT SELECT, INSERT, DELETE ON public.group_members TO authenticated;

-- Create a simple function to check if user is member of a group
CREATE OR REPLACE FUNCTION public.is_group_member(group_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_uuid AND user_id = user_uuid
  );
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
