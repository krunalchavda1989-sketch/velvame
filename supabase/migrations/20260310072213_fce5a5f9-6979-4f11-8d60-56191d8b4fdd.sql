-- Fix: Restrict SMS settings to admin-only SELECT
DROP POLICY IF EXISTS "Anyone can view sms settings" ON public.sms_settings;

CREATE POLICY "Only admins can view sms settings"
ON public.sms_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));