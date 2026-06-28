-- 1. PRODUCTS: restrict direct SELECT to admins or paid members
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;

CREATE POLICY "Admins and members can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.subscription_paid = true
    )
  );

-- 2. PRODUCT_VARIATIONS: drop anon, keep authenticated view (admin manages already exists)
DROP POLICY IF EXISTS "Anyone can view product variations" ON public.product_variations;

CREATE POLICY "Admins can view product variations"
  ON public.product_variations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.product_variations FROM anon;

-- 3. PRODUCT_TAGS: drop anon
DROP POLICY IF EXISTS "Anyone can view product tags" ON public.product_tags;

CREATE POLICY "Admins can view product tags"
  ON public.product_tags FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.product_tags FROM anon;

-- 4. Helper RPC for cart/order screens — returns ONLY safe basic fields, no pricing
CREATE OR REPLACE FUNCTION public.get_products_basic(_ids uuid[])
RETURNS TABLE(id uuid, name text, image_url text, category text, active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.image_url, p.category, p.active
  FROM public.products p
  WHERE p.id = ANY(_ids);
$$;

REVOKE EXECUTE ON FUNCTION public.get_products_basic(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_products_basic(uuid[]) TO authenticated;