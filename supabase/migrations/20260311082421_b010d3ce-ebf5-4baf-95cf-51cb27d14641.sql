
-- Allow authenticated users to read payment-gateway-settings (not anonymous)
CREATE POLICY "Authenticated can view payment gateway settings"
ON public.pages_content
FOR SELECT
TO authenticated
USING (page_slug = 'payment-gateway-settings');
