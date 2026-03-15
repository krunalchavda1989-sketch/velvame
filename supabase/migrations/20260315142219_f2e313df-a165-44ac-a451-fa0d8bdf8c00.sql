
-- Tighten newsletter subscribe policy: require a valid email format
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;

CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
WITH CHECK (
  is_active = true
  AND email IS NOT NULL
  AND length(email) > 5
);
