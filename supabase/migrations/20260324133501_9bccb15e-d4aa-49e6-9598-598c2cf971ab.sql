
-- Allow anonymous users to view active announcements
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;
CREATE POLICY "Anyone can view active announcements"
ON public.announcements
FOR SELECT
TO anon, authenticated
USING (is_active = true);
