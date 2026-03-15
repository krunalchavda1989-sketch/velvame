
-- Fix: Exclude admin-only slugs from the public read policy
DROP POLICY IF EXISTS "Anyone can view published pages" ON public.pages_content;

CREATE POLICY "Anyone can view published pages"
ON public.pages_content FOR SELECT TO anon, authenticated
USING (
  is_published = true
  AND page_slug NOT IN ('payment-gateway-settings', 'membership-settings')
);
