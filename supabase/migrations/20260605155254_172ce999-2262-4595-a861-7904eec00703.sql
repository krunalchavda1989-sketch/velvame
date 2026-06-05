
-- 1. Reel thumbnails: admin-only update/delete
DROP POLICY IF EXISTS "Authenticated users can update reel thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete reel thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload reel thumbnails" ON storage.objects;

CREATE POLICY "Admins can upload reel thumbnails"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reel-thumbnails' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update reel thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'reel-thumbnails' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'reel-thumbnails' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete reel thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'reel-thumbnails' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Commission reprocess runs: drop global visibility, keep affected-user only
DROP POLICY IF EXISTS "Users can view runs that affected them" ON public.commission_reprocess_runs;

CREATE POLICY "Users can view runs that affected them"
ON public.commission_reprocess_runs FOR SELECT TO authenticated
USING (affected_user_id = auth.uid());

-- 3. Coupons: require auth to list active coupons (admin-manage policy unchanged)
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;

CREATE POLICY "Authenticated users can view active coupons"
ON public.coupons FOR SELECT TO authenticated
USING (is_active = true);

REVOKE SELECT ON public.coupons FROM anon;
