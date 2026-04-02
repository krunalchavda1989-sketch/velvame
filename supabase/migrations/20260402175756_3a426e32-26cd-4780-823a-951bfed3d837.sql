
-- Drop the overly permissive direct referral SELECT policy
DROP POLICY IF EXISTS "Users can view direct referrals" ON public.profiles;

-- Create a secure function that returns only non-sensitive referral profile data
CREATE OR REPLACE FUNCTION public.get_direct_referrals(_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  first_name text,
  middle_name text,
  last_name text,
  referral_code text,
  title text,
  subscription_paid boolean,
  direct_referral_count integer,
  created_at timestamptz,
  avatar_url text,
  referred_by uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id, p.user_id, p.full_name, p.first_name, p.middle_name, p.last_name,
    p.referral_code, p.title, p.subscription_paid, p.direct_referral_count,
    p.created_at, p.avatar_url, p.referred_by
  FROM public.profiles p
  WHERE p.referred_by = (SELECT pr.id FROM public.profiles pr WHERE pr.user_id = _user_id)
  ORDER BY p.created_at ASC;
$$;
