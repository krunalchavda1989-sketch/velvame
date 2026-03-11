
-- 1. Fix WhatsApp settings: drop public SELECT, add admin-only SELECT
DROP POLICY IF EXISTS "Anyone can view whatsapp settings" ON public.whatsapp_settings;

CREATE POLICY "Only admins can view whatsapp settings"
ON public.whatsapp_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix profiles privilege escalation: restrict user UPDATE to safe columns only
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Revoke UPDATE on sensitive columns from authenticated role
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, avatar_url) ON public.profiles TO authenticated;

-- Re-create UPDATE policy scoped to own row
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
