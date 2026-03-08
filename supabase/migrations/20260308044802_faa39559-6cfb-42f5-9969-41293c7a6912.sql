
-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view direct referrals" ON public.profiles;

-- Create a security definer function to check direct referrals without recursion
CREATE OR REPLACE FUNCTION public.is_direct_referral(_viewer_user_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles viewer
    WHERE viewer.user_id = _viewer_user_id
      AND EXISTS (
        SELECT 1 FROM public.profiles target
        WHERE target.id = _profile_id
          AND target.referred_by = viewer.id
      )
  )
$$;

-- Recreate the policy using the function
CREATE POLICY "Users can view direct referrals"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_direct_referral(auth.uid(), id));
