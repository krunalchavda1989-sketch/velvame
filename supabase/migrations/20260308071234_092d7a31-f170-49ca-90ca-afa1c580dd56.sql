
-- Update function to support viewing tree from any profile
CREATE OR REPLACE FUNCTION public.get_genealogy_tree(_user_id uuid, _max_depth integer DEFAULT 9, _root_profile_id uuid DEFAULT NULL)
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
    WHERE 
      CASE 
        WHEN _root_profile_id IS NOT NULL THEN p.id = _root_profile_id
        ELSE p.user_id = _user_id
      END

    UNION ALL

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
