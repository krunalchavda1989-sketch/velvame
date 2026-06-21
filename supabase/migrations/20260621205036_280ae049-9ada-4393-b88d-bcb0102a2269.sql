-- Remove public SELECT exposure of products (which leaks distributor_price to anonymous visitors)
-- Anonymous guests must use the get_public_products() RPC, which already hides distributor pricing.
DROP POLICY IF EXISTS "Products viewable by all" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Public can view products" ON public.products;

CREATE POLICY "Authenticated users can view products"
ON public.products
FOR SELECT
TO authenticated
USING (true);

REVOKE SELECT ON public.products FROM anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

-- Allow anon to call the safe public RPC (it strips distributor pricing for non-members)
GRANT EXECUTE ON FUNCTION public.get_public_products() TO anon, authenticated;