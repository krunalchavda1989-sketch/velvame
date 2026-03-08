
-- Recursive function to get genealogy tree for a user
CREATE OR REPLACE FUNCTION public.get_genealogy_tree(_user_id uuid, _max_depth integer DEFAULT 9)
RETURNS TABLE(
  profile_id uuid,
  user_id uuid,
  full_name text,
  referral_code text,
  title text,
  subscription_paid boolean,
  avatar_url text,
  referred_by uuid,
  direct_referral_count integer,
  depth integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE tree AS (
    -- Root: the logged-in user's profile
    SELECT 
      p.id AS profile_id,
      p.user_id,
      p.full_name,
      p.referral_code,
      p.title,
      p.subscription_paid,
      p.avatar_url,
      p.referred_by,
      p.direct_referral_count,
      0 AS depth
    FROM public.profiles p
    WHERE p.user_id = _user_id

    UNION ALL

    -- Children: profiles referred by current level
    SELECT 
      c.id AS profile_id,
      c.user_id,
      c.full_name,
      c.referral_code,
      c.title,
      c.subscription_paid,
      c.avatar_url,
      c.referred_by,
      c.direct_referral_count,
      t.depth + 1
    FROM public.profiles c
    INNER JOIN tree t ON c.referred_by = t.profile_id
    WHERE t.depth < _max_depth
  )
  SELECT * FROM tree ORDER BY depth, full_name;
$$;
