
-- 1) commission_reprocess_runs: restrict SELECT to admins only
DROP POLICY IF EXISTS "Users can view runs that affected them" ON public.commission_reprocess_runs;

-- 2) products: restrict direct SELECT to admins only; non-admin clients must use get_public_products() RPC (which masks distributor_price)
DROP POLICY IF EXISTS "Admins and members can view products" ON public.products;
CREATE POLICY "Admins can view products"
ON public.products
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3) tax_settings: restrict SELECT to admins; expose only gst_number string via RPC for invoices/branding
DROP POLICY IF EXISTS "Authenticated users can view tax settings" ON public.tax_settings;

CREATE OR REPLACE FUNCTION public.get_public_gst_number()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gst_number FROM public.tax_settings LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_gst_number() TO anon, authenticated;
