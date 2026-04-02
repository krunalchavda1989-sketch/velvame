
-- Fix 1: Drop the referral policy that exposes PII (phone, birth_date, anniversary_date)
DROP POLICY IF EXISTS "Users can view direct referrals" ON public.profiles;

-- Fix 3: Create a secure products view that hides distributor_price from non-members
-- First, restrict the public products policy to only allow row access (RLS is row-level, not column-level)
-- We'll create a security definer function to safely fetch products without exposing distributor_price to anon users
CREATE OR REPLACE FUNCTION public.get_public_products()
RETURNS TABLE(
  id uuid,
  name text,
  category text,
  retail_price numeric,
  distributor_price numeric,
  image_url text,
  stock integer,
  active boolean,
  description text,
  seo_slug text,
  seo_title text,
  seo_description text,
  seo_keywords text,
  rating numeric,
  sort_order integer,
  allow_backorder boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id, p.name, p.category, p.retail_price,
    CASE 
      WHEN auth.uid() IS NOT NULL AND (
        SELECT pr.subscription_paid FROM public.profiles pr WHERE pr.user_id = auth.uid()
      ) = true
      THEN p.distributor_price
      ELSE p.retail_price  -- hide distributor price, return retail instead
    END AS distributor_price,
    p.image_url, p.stock, p.active, p.description,
    p.seo_slug, p.seo_title, p.seo_description, p.seo_keywords,
    p.rating, p.sort_order, p.allow_backorder, p.created_at
  FROM public.products p
  WHERE p.active = true;
$$;
