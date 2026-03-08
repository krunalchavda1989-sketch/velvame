
CREATE TABLE public.hero_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'users',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active hero stats"
  ON public.hero_stats FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage hero stats"
  ON public.hero_stats FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default stats
INSERT INTO public.hero_stats (label, value, icon, sort_order) VALUES
  ('Happy Customers', '50,000+', 'users', 0),
  ('Rewards Distributed', '₹12Cr+', 'trending-up', 1),
  ('Premium Products', '500+', 'award', 2),
  ('Customer Support', '24/7', 'zap', 3);
