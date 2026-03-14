
DROP POLICY IF EXISTS "Authenticated can view payment gateway settings" ON public.pages_content;

CREATE POLICY "Admins can view payment gateway settings"
ON public.pages_content FOR SELECT TO authenticated
USING (page_slug = 'payment-gateway-settings' AND has_role(auth.uid(), 'admin'::app_role));
